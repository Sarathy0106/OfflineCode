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
import com.offlinecode.ui.theme.EditorTheme
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

    private val _timeoutSeconds = MutableStateFlow(30)
    val timeoutSeconds = _timeoutSeconds.asStateFlow()

    private val _savedSnippets = MutableStateFlow<List<Snippet>>(emptyList())
    val savedSnippets = _savedSnippets.asStateFlow()

    private val _currentFileName = MutableStateFlow<String?>(null)
    val currentFileName = _currentFileName.asStateFlow()

    // Editor Theme State
    private val _selectedTheme = MutableStateFlow(EditorTheme.ONE_DARK)
    val selectedTheme = _selectedTheme.asStateFlow()

    // Compiler Options State (default -O0 for instant, fast compilation on mobile devices)
    private val _cppOptimization = MutableStateFlow("-O0")
    val cppOptimization = _cppOptimization.asStateFlow()

    private val _cppWarnings = MutableStateFlow(false)
    val cppWarnings = _cppWarnings.asStateFlow()

    // Find & Replace State
    private val _isSearchOpen = MutableStateFlow(false)
    val isSearchOpen = _isSearchOpen.asStateFlow()

    private val _isReplaceOpen = MutableStateFlow(false)
    val isReplaceOpen = _isReplaceOpen.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()

    private val _replaceQuery = MutableStateFlow("")
    val replaceQuery = _replaceQuery.asStateFlow()

    private val _matchIndices = MutableStateFlow<List<Int>>(emptyList())
    val matchIndices = _matchIndices.asStateFlow()

    private val _currentMatchIndex = MutableStateFlow(0)
    val currentMatchIndex = _currentMatchIndex.asStateFlow()

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
        if (_isSearchOpen.value && _searchQuery.value.isNotEmpty()) {
            recalculateMatches(_searchQuery.value, newValue.text)
        }
    }

    private fun updateEditorValue(newValue: TextFieldValue) {
        _editorValue.value = newValue
        undoStack.clear()
        redoStack.clear()
        if (_isSearchOpen.value && _searchQuery.value.isNotEmpty()) {
            recalculateMatches(_searchQuery.value, newValue.text)
        }
    }

    fun undo() {
        if (undoStack.isNotEmpty()) {
            val previous = undoStack.removeAt(undoStack.size - 1)
            redoStack.add(_editorValue.value.text)
            _editorValue.value = TextFieldValue(previous, TextRange(previous.length))
            if (_isSearchOpen.value) recalculateMatches(_searchQuery.value, previous)
        }
    }

    fun redo() {
        if (redoStack.isNotEmpty()) {
            val next = redoStack.removeAt(redoStack.size - 1)
            undoStack.add(_editorValue.value.text)
            _editorValue.value = TextFieldValue(next, TextRange(next.length))
            if (_isSearchOpen.value) recalculateMatches(_searchQuery.value, next)
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

    // Toggle Comment/Uncomment for current line or multi-line selection
    fun toggleComment() {
        val current = _editorValue.value
        val text = current.text
        val selection = current.selection
        val commentPrefix = if (_selectedLanguage.value == "python") "# " else "// "

        val lines = text.lines().toMutableList()
        val selStart = minOf(selection.start, selection.end)
        val selEnd = maxOf(selection.start, selection.end)

        var charOffset = 0
        var startLine = 0
        var endLine = 0
        var foundStart = false

        for (i in lines.indices) {
            val lineLen = lines[i].length + 1
            if (!foundStart && charOffset + lineLen > selStart) {
                startLine = i
                foundStart = true
            }
            if (charOffset + lineLen > selEnd || (i == lines.lastIndex && !foundStart)) {
                endLine = i
                break
            }
            charOffset += lineLen
        }
        if (endLine < startLine) endLine = startLine

        val allCommented = (startLine..endLine).all { idx ->
            val trimmed = lines[idx].trimStart()
            trimmed.startsWith(commentPrefix.trim())
        }

        if (allCommented) {
            for (idx in startLine..endLine) {
                val line = lines[idx]
                val firstNonWs = line.indexOfFirst { !it.isWhitespace() }
                if (firstNonWs != -1) {
                    val afterWs = line.substring(firstNonWs)
                    val cleanAfterWs = if (afterWs.startsWith(commentPrefix)) {
                        afterWs.substring(commentPrefix.length)
                    } else if (afterWs.startsWith(commentPrefix.trim())) {
                        afterWs.substring(commentPrefix.trim().length)
                    } else {
                        afterWs
                    }
                    lines[idx] = line.substring(0, firstNonWs) + cleanAfterWs
                }
            }
        } else {
            for (idx in startLine..endLine) {
                val line = lines[idx]
                val firstNonWs = line.indexOfFirst { !it.isWhitespace() }
                if (firstNonWs != -1) {
                    lines[idx] = line.substring(0, firstNonWs) + commentPrefix + line.substring(firstNonWs)
                } else {
                    lines[idx] = commentPrefix
                }
            }
        }

        val newText = lines.joinToString("\n")
        onEditorChange(TextFieldValue(newText, TextRange(minOf(selStart, newText.length))))
    }

    // Code Beautifier / Auto-Indent Formatter
    fun formatCode() {
        val current = _editorValue.value
        val text = current.text
        if (text.isBlank()) return

        val lang = _selectedLanguage.value.lowercase()
        val formatted = if (lang == "python") {
            formatPythonCode(text)
        } else {
            formatBraceCode(text)
        }

        if (formatted != text) {
            onEditorChange(TextFieldValue(formatted, TextRange(minOf(current.selection.start, formatted.length))))
        }
    }

    private fun formatBraceCode(text: String): String {
        val lines = text.lines()
        val formattedLines = mutableListOf<String>()
        var indentLevel = 0

        for (rawLine in lines) {
            val trimmed = rawLine.trim()
            if (trimmed.isEmpty()) {
                formattedLines.add("")
                continue
            }

            // Adjust indent down if line starts with closing brace
            var startsWithClosing = 0
            for (ch in trimmed) {
                if (ch == '}' || ch == ')' || ch == ']') startsWithClosing++ else break
            }
            val effectiveIndent = maxOf(0, indentLevel - startsWithClosing)
            val indentString = "    ".repeat(effectiveIndent)
            formattedLines.add(indentString + trimmed)

            // Calculate change in indent for next line
            var inStr = false
            var strChar = ' '
            var opens = 0
            var closes = 0
            var i = 0
            while (i < trimmed.length) {
                val c = trimmed[i]
                if (inStr) {
                    if (c == '\\') {
                        i++ // Skip escape
                    } else if (c == strChar) {
                        inStr = false
                    }
                } else {
                    if (c == '"' || c == '\'') {
                        inStr = true
                        strChar = c
                    } else if (c == '/' && i + 1 < trimmed.length && trimmed[i + 1] == '/') {
                        break // Comment to end of line
                    } else if (c == '{') {
                        opens++
                    } else if (c == '}') {
                        closes++
                    }
                }
                i++
            }
            indentLevel = maxOf(0, indentLevel + opens - closes)
        }

        return formattedLines.joinToString("\n")
    }

    private fun formatPythonCode(text: String): String {
        val lines = text.lines()
        val formatted = mutableListOf<String>()
        var emptyCount = 0

        for (line in lines) {
            val trimmedEnd = line.trimEnd()
            if (trimmedEnd.isEmpty()) {
                emptyCount++
                if (emptyCount <= 2) {
                    formatted.add("")
                }
            } else {
                emptyCount = 0
                formatted.add(trimmedEnd)
            }
        }
        return formatted.joinToString("\n")
    }

    // Find & Replace Logic
    fun toggleSearch(open: Boolean? = null) {
        val target = open ?: !_isSearchOpen.value
        _isSearchOpen.value = target
        if (!target) {
            _isReplaceOpen.value = false
            _searchQuery.value = ""
            _matchIndices.value = emptyList()
        } else if (_searchQuery.value.isNotEmpty()) {
            recalculateMatches(_searchQuery.value, _editorValue.value.text)
        }
    }

    fun toggleReplace(open: Boolean? = null) {
        _isReplaceOpen.value = open ?: !_isReplaceOpen.value
    }

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
        recalculateMatches(query, _editorValue.value.text)
    }

    fun updateReplaceQuery(query: String) {
        _replaceQuery.value = query
    }

    private fun recalculateMatches(query: String, text: String) {
        if (query.isEmpty() || text.isEmpty()) {
            _matchIndices.value = emptyList()
            _currentMatchIndex.value = 0
            return
        }

        val indices = mutableListOf<Int>()
        var idx = text.indexOf(query, ignoreCase = true)
        while (idx != -1) {
            indices.add(idx)
            idx = text.indexOf(query, idx + 1, ignoreCase = true)
        }

        _matchIndices.value = indices
        if (indices.isNotEmpty()) {
            val cursor = _editorValue.value.selection.start
            val closest = indices.indexOfFirst { it >= cursor }
            _currentMatchIndex.value = if (closest != -1) closest else 0
        } else {
            _currentMatchIndex.value = 0
        }
    }

    fun findNext() {
        val matches = _matchIndices.value
        if (matches.isEmpty()) return
        val nextIndex = (_currentMatchIndex.value + 1) % matches.size
        _currentMatchIndex.value = nextIndex
        highlightMatch(matches[nextIndex])
    }

    fun findPrevious() {
        val matches = _matchIndices.value
        if (matches.isEmpty()) return
        val prevIndex = if (_currentMatchIndex.value - 1 < 0) matches.size - 1 else _currentMatchIndex.value - 1
        _currentMatchIndex.value = prevIndex
        highlightMatch(matches[prevIndex])
    }

    private fun highlightMatch(startOffset: Int) {
        val queryLen = _searchQuery.value.length
        val endOffset = minOf(_editorValue.value.text.length, startOffset + queryLen)
        _editorValue.value = _editorValue.value.copy(selection = TextRange(startOffset, endOffset))
    }

    fun replaceCurrent() {
        val matches = _matchIndices.value
        if (matches.isEmpty()) return
        val query = _searchQuery.value
        val replaceWith = _replaceQuery.value
        val currentIdx = _currentMatchIndex.value
        if (currentIdx >= matches.size) return

        val matchStart = matches[currentIdx]
        val text = _editorValue.value.text
        if (matchStart + query.length <= text.length) {
            val newText = text.substring(0, matchStart) + replaceWith + text.substring(matchStart + query.length)
            onEditorChange(TextFieldValue(newText, TextRange(matchStart + replaceWith.length)))
            recalculateMatches(query, newText)
        }
    }

    fun replaceAll() {
        val query = _searchQuery.value
        if (query.isEmpty()) return
        val text = _editorValue.value.text
        val replaceWith = _replaceQuery.value
        val newText = text.replace(query, replaceWith, ignoreCase = true)
        if (newText != text) {
            onEditorChange(TextFieldValue(newText, TextRange(0)))
            recalculateMatches(query, newText)
        }
    }

    fun setTheme(theme: EditorTheme) {
        _selectedTheme.value = theme
    }

    fun setCppOptimization(opt: String) {
        _cppOptimization.value = opt
    }

    fun setCppWarnings(enabled: Boolean) {
        _cppWarnings.value = enabled
    }

    fun runCode() {
        if (_isRunning.value) return

        val lang = _selectedLanguage.value
        val langDisplay = when (lang) {
            "cpp" -> "C++ (Clang 17)"
            "c" -> "C (TinyCC)"
            "python" -> "Python 3.10"
            "java" -> "Java"
            else -> lang.uppercase()
        }
        _runEvents.value = listOf(RunEvent.Stdout("[Compiling & Running $langDisplay...]\n"))
        _isRunning.value = true

        val source = _editorValue.value.text
        val limits = Limits(timeoutSeconds = _timeoutSeconds.value, memoryLimitMb = 256)

        // Pass optimization and compiler flags as query parameters
        val targetLang = if (lang == "cpp" || lang == "c") {
            "$lang?opt=${_cppOptimization.value}&wall=${_cppWarnings.value}"
        } else {
            lang
        }

        runJob = viewModelScope.launch {
            client.execute(targetLang, source, stdinFlow, limits).collect { event ->
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
        _runEvents.value = _runEvents.value + RunEvent.Stdout("> $input")
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

    private fun loadSnippets() {
        if (!snippetsFile.exists()) return
        try {
            val jsonStr = snippetsFile.readText()
            val array = JSONArray(jsonStr)
            val list = mutableListOf<Snippet>()
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                list.add(
                    Snippet(
                        id = obj.getString("id"),
                        title = obj.getString("title"),
                        language = obj.getString("language"),
                        code = obj.getString("code")
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
            val array = JSONArray()
            for (s in list) {
                val obj = JSONObject()
                obj.put("id", s.id)
                obj.put("title", s.title)
                obj.put("language", s.language)
                obj.put("code", s.code)
                array.put(obj)
            }
            snippetsFile.writeText(array.toString(2))
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
