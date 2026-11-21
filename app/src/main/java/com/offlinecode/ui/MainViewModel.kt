package com.offlinecode.ui

import android.app.Application
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.TextFieldValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.offlinecode.core.Limits
import com.offlinecode.core.RunEvent
import com.offlinecode.core.Snippet
import com.offlinecode.core.TemplateManager
import com.offlinecode.runner.CodeRunnerClient
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val client = CodeRunnerClient(application)
    private val stdinFlow = MutableSharedFlow<String>(extraBufferCapacity = 64)
    private var runJob: Job? = null

    private val _selectedLanguage = MutableStateFlow("python")
    val selectedLanguage = _selectedLanguage.asStateFlow()

    private val _editorValue = MutableStateFlow(TextFieldValue(TemplateManager.getTemplate("python")))
    val editorValue = _editorValue.asStateFlow()

    private val undoStack = mutableListOf<String>()
    private val redoStack = mutableListOf<String>()

    private val _runEvents = MutableStateFlow<List<RunEvent>>(emptyList())
    val runEvents = _runEvents.asStateFlow()

    private val _isRunning = MutableStateFlow(false)
    val isRunning = _isRunning.asStateFlow()

    private val _fontSizeSp = MutableStateFlow(14f)
    val fontSizeSp = _fontSizeSp.asStateFlow()

    private val _timeoutSeconds = MutableStateFlow(10)
    val timeoutSeconds = _timeoutSeconds.asStateFlow()

    private val _savedSnippets = MutableStateFlow<List<Snippet>>(emptyList())
    val savedSnippets = _savedSnippets.asStateFlow()

    private val _currentFileName = MutableStateFlow<String?>(null)
    val currentFileName = _currentFileName.asStateFlow()

    private val snippetsFile = File(application.filesDir, "snippets.json")

    init {
        loadSnippets()
    }

    fun getExtensionForLanguage(lang: String): String = when (lang.lowercase()) {
        "python" -> ".py"
        "c" -> ".c"
        "java" -> ".java"
        "cpp" -> ".cpp"
        else -> ".txt"
    }

    fun getDefaultFileName(): String = when (_selectedLanguage.value.lowercase()) {
        "python" -> "main.py"
        "c" -> "main.c"
        "java" -> "Main.java"
        "cpp" -> "main.cpp"
        else -> "code.txt"
    }

    fun detectLanguageFromFileName(name: String): String {
        val lower = name.lowercase()
        return when {
            lower.endsWith(".py") -> "python"
            lower.endsWith(".c") || lower.endsWith(".h") -> "c"
            lower.endsWith(".java") -> "java"
            lower.endsWith(".cpp") || lower.endsWith(".cc") || lower.endsWith(".cxx") || lower.endsWith(".hpp") || lower.endsWith(".h++") -> "cpp"
            else -> _selectedLanguage.value
        }
    }

    fun openFileFromUri(context: android.content.Context, uri: android.net.Uri) {
        try {
            var fileName = if (uri.scheme == "file") {
                File(uri.path ?: "").name
            } else {
                "unknown"
            }

            if (uri.scheme == "content") {
                try {
                    context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                        val nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                        if (nameIndex != -1 && cursor.moveToFirst()) {
                            fileName = cursor.getString(nameIndex) ?: fileName
                        }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            if (fileName == "unknown" || fileName.isEmpty()) {
                fileName = uri.lastPathSegment ?: "code${getExtensionForLanguage(_selectedLanguage.value)}"
            }

            val text = if (uri.scheme == "file") {
                File(uri.path ?: "").readText()
            } else {
                context.contentResolver.openInputStream(uri)?.use { stream ->
                    stream.bufferedReader().readText()
                }
            } ?: return

            val detectedLang = detectLanguageFromFileName(fileName)
            _selectedLanguage.value = detectedLang
            _currentFileName.value = fileName
            updateEditorValue(TextFieldValue(text, TextRange(0)))
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun saveFileToUri(context: android.content.Context, uri: android.net.Uri) {
        try {
            context.contentResolver.openOutputStream(uri)?.use { stream ->
                stream.write(_editorValue.value.text.toByteArray(Charsets.UTF_8))
            }
            var fileName: String? = null
            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                if (nameIndex != -1 && cursor.moveToFirst()) {
                    fileName = cursor.getString(nameIndex)
                }
            }
            if (fileName != null) {
                _currentFileName.value = fileName
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun selectLanguage(lang: String) {
        if (_selectedLanguage.value != lang) {
            _selectedLanguage.value = lang
            _currentFileName.value = null
            val template = TemplateManager.getTemplate(lang)
            updateEditorValue(TextFieldValue(template, TextRange(template.length)))
        }
    }

    fun onEditorChange(newValue: TextFieldValue) {
        val currentText = _editorValue.value.text
        if (currentText != newValue.text) {
            undoStack.add(currentText)
            if (undoStack.size > 50) undoStack.removeAt(0)
            redoStack.clear()
        }
        _editorValue.value = newValue
    }

    fun undo() {
        if (undoStack.isNotEmpty()) {
            val previous = undoStack.removeAt(undoStack.size - 1)
            redoStack.add(_editorValue.value.text)
            _editorValue.value = TextFieldValue(previous, TextRange(previous.length))
        }
    }

    fun redo() {
        if (redoStack.isNotEmpty()) {
            val next = redoStack.removeAt(redoStack.size - 1)
            undoStack.add(_editorValue.value.text)
            _editorValue.value = TextFieldValue(next, TextRange(next.length))
        }
    }

    fun insertSymbol(symbol: String) {
        val current = _editorValue.value
        val text = current.text
        val selection = current.selection

        val pairs = mapOf(
            "{" to "}",
            "(" to ")",
            "[" to "]",
            "\"" to "\"",
            "'" to "'"
        )

        if (pairs.containsKey(symbol)) {
            val close = pairs[symbol]!!
            if (selection.length > 0) {
                // Wrap selection
                val selectedText = text.substring(selection.start, selection.end)
                val newText = text.substring(0, selection.start) + symbol + selectedText + close + text.substring(selection.end)
                val newCursor = selection.end + 2
                onEditorChange(TextFieldValue(newText, TextRange(newCursor)))
            } else {
                // Insert pair with cursor in middle
                val newText = text.substring(0, selection.start) + symbol + close + text.substring(selection.start)
                val newCursor = selection.start + 1
                onEditorChange(TextFieldValue(newText, TextRange(newCursor)))
            }
        } else {
            val newText = text.substring(0, selection.start) + symbol + text.substring(selection.end)
            val newCursor = selection.start + symbol.length
            onEditorChange(TextFieldValue(newText, TextRange(newCursor)))
        }
    }

    fun jumpToLine(line: Int, col: Int) {
        val text = _editorValue.value.text
        val lines = text.lines()
        if (line <= 0 || line > lines.size) return

        var offset = 0
        for (i in 0 until (line - 1)) {
            offset += lines[i].length + 1 // +1 for newline
        }
        val targetOffset = minOf(text.length, offset + maxOf(0, col))
        _editorValue.value = _editorValue.value.copy(selection = TextRange(targetOffset))
    }

    fun runCode() {
        if (_isRunning.value) return

        _runEvents.value = emptyList()
        _isRunning.value = true

        val lang = _selectedLanguage.value
        val source = _editorValue.value.text
        val limits = Limits(timeoutSeconds = _timeoutSeconds.value, memoryLimitMb = 256)

        runJob = viewModelScope.launch {
            client.execute(lang, source, stdinFlow, limits).collect { event ->
                _runEvents.value = _runEvents.value + event
                if (event is RunEvent.Exit) {
                    _isRunning.value = false
                }
            }
            _isRunning.value = false
        }
    }

    fun stopCode() {
        client.stop()
        runJob?.cancel()
        _isRunning.value = false
        _runEvents.value = _runEvents.value + RunEvent.Stderr("\n[Execution stopped by user]\n")
        _runEvents.value = _runEvents.value + RunEvent.Exit(-1, 0)
    }

    fun sendStdin(input: String) {
        stdinFlow.tryEmit(input)
        _runEvents.value = _runEvents.value + RunEvent.Stdout(input)
    }

    fun clearConsole() {
        _runEvents.value = emptyList()
    }

    fun setFontSize(size: Float) {
        _fontSizeSp.value = size
    }

    fun setTimeout(timeout: Int) {
        _timeoutSeconds.value = timeout
    }

    fun saveCurrentSnippet(title: String) {
        val ext = getExtensionForLanguage(_selectedLanguage.value)
        val cleanTitle = if (title.endsWith(ext, ignoreCase = true)) {
            title
        } else {
            val baseName = if (title.contains('.')) title.substringBeforeLast('.') else title
            baseName + ext
        }
        val snippet = Snippet(
            id = System.currentTimeMillis().toString(),
            title = cleanTitle,
            language = _selectedLanguage.value,
            code = _editorValue.value.text
        )
        val list = _savedSnippets.value + snippet
        _savedSnippets.value = list
        persistSnippets(list)
    }

    fun loadSnippet(snippet: Snippet) {
        _selectedLanguage.value = snippet.language
        updateEditorValue(TextFieldValue(snippet.code, TextRange(snippet.code.length)))
    }

    fun deleteSnippet(id: String) {
        val list = _savedSnippets.value.filter { it.id != id }
        _savedSnippets.value = list
        persistSnippets(list)
    }

    private fun updateEditorValue(newValue: TextFieldValue) {
        undoStack.clear()
        redoStack.clear()
        _editorValue.value = newValue
    }

    private fun loadSnippets() {
        if (!snippetsFile.exists()) return
        try {
            val jsonStr = snippetsFile.readText()
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<Snippet>()
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                list.add(
                    Snippet(
                        id = obj.getString("id"),
                        title = obj.getString("title"),
                        language = obj.getString("language"),
                        code = obj.getString("code"),
                        updatedAt = obj.optLong("updatedAt", System.currentTimeMillis())
                    )
                )
            }
            _savedSnippets.value = list
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun persistSnippets(list: List<Snippet>) {
        try {
            val jsonArray = JSONArray()
            for (s in list) {
                val obj = JSONObject()
                obj.put("id", s.id)
                obj.put("title", s.title)
                obj.put("language", s.language)
                obj.put("code", s.code)
                obj.put("updatedAt", s.updatedAt)
                jsonArray.put(obj)
            }
            snippetsFile.writeText(jsonArray.toString(2))
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
