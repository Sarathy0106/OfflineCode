package com.offlinecode.ui

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Redo
import androidx.compose.material.icons.automirrored.filled.Undo
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.offlinecode.core.Snippet
import com.offlinecode.ui.theme.OfflineCodeTheme
import com.offlinecode.ui.theme.PrimaryBlue

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            OfflineCodeTheme(darkTheme = true) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen(
                        viewModel = viewModel,
                        onShare = { code, lang ->
                            val sendIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, code)
                                type = "text/plain"
                            }
                            startActivity(Intent.createChooser(sendIntent, "Share $lang snippet"))
                        }
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    viewModel: MainViewModel,
    onShare: (String, String) -> Unit
) {
    val selectedLanguage by viewModel.selectedLanguage.collectAsState()
    val editorValue by viewModel.editorValue.collectAsState()
    val runEvents by viewModel.runEvents.collectAsState()
    val isRunning by viewModel.isRunning.collectAsState()
    val fontSizeSp by viewModel.fontSizeSp.collectAsState()
    val timeoutSeconds by viewModel.timeoutSeconds.collectAsState()
    val savedSnippets by viewModel.savedSnippets.collectAsState()

    var showSnippetsDialog by remember { mutableStateOf(false) }
    var showPacksDialog by remember { mutableStateOf(false) }
    var showSettingsDialog by remember { mutableStateOf(false) }
    var showSaveSnippetDialog by remember { mutableStateOf(false) }
    var newSnippetTitle by remember { mutableStateOf("") }

    val languages = listOf(
        "python" to "Python",
        "c" to "C",
        "java" to "Java",
        "cpp" to "C++"
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "OfflineCode",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = Color.White
                    )
                },
                actions = {
                    IconButton(onClick = { viewModel.undo() }) {
                        Icon(Icons.AutoMirrored.Filled.Undo, contentDescription = "Undo", tint = Color.LightGray)
                    }
                    IconButton(onClick = { viewModel.redo() }) {
                        Icon(Icons.AutoMirrored.Filled.Redo, contentDescription = "Redo", tint = Color.LightGray)
                    }
                    IconButton(onClick = { showSnippetsDialog = true }) {
                        Icon(Icons.Default.Folder, contentDescription = "Snippets", tint = Color.LightGray)
                    }
                    IconButton(onClick = { showPacksDialog = true }) {
                        Icon(Icons.Default.Extension, contentDescription = "Packs", tint = Color.LightGray)
                    }
                    IconButton(onClick = { showSettingsDialog = true }) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings", tint = Color.LightGray)
                    }
                    IconButton(onClick = { onShare(editorValue.text, selectedLanguage) }) {
                        Icon(Icons.Default.Share, contentDescription = "Share", tint = Color.LightGray)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E1E1E))
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Secondary Control Bar: Language selector and Run/Stop button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF252526))
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    languages.forEach { (id, label) ->
                        val isSelected = selectedLanguage == id
                        Box(
                            modifier = Modifier
                                .padding(end = 6.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (isSelected) PrimaryBlue else Color(0xFF333333))
                                .clickable { viewModel.selectLanguage(id) }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = label,
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) Color.White else Color.LightGray
                            )
                        }
                    }
                }

                if (isRunning) {
                    Button(
                        onClick = { viewModel.stopCode() },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD32F2F)),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.Stop, contentDescription = "Stop", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Stop", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                } else {
                    Button(
                        onClick = { viewModel.runCode() },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = "Run", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Run", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Editor Pane (Top)
            EditorView(
                textFieldValue = editorValue,
                onValueChange = { viewModel.onEditorChange(it) },
                language = selectedLanguage,
                fontSizeSp = fontSizeSp,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            )

            // Extra Symbol Row (Keyboard accessory)
            SymbolRow(
                onInsertSymbol = { symbol -> viewModel.insertSymbol(symbol) }
            )

            // Console Panel (Bottom)
            ConsolePanel(
                events = runEvents,
                isRunning = isRunning,
                onSendStdin = { viewModel.sendStdin(it) },
                onStop = { viewModel.stopCode() },
                onClear = { viewModel.clearConsole() },
                onJumpToLine = { line, col -> viewModel.jumpToLine(line, col) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(240.dp)
            )
        }
    }

    // Snippets Dialog
    if (showSnippetsDialog) {
        AlertDialog(
            onDismissRequest = { showSnippetsDialog = false },
            title = { Text("Saved Snippets", fontWeight = FontWeight.Bold) },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Button(
                        onClick = {
                            showSnippetsDialog = false
                            showSaveSnippetDialog = true
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Save Current Code")
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (savedSnippets.isEmpty()) {
                        Text(
                            text = "No saved snippets yet.",
                            color = Color.Gray,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                    } else {
                        LazyColumn(modifier = Modifier.heightIn(max = 240.dp)) {
                            items(savedSnippets) { snippet ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            viewModel.loadSnippet(snippet)
                                            showSnippetsDialog = false
                                        }
                                        .padding(vertical = 6.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(text = snippet.title, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                                        Text(
                                            text = snippet.language.uppercase(),
                                            color = PrimaryBlue,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    IconButton(onClick = { viewModel.deleteSnippet(snippet.id) }) {
                                        Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.Gray)
                                    }
                                }
                                HorizontalDivider(color = Color(0xFF333333))
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showSnippetsDialog = false }) {
                    Text("Close")
                }
            }
        )
    }

    // Save Snippet Dialog
    if (showSaveSnippetDialog) {
        AlertDialog(
            onDismissRequest = { showSaveSnippetDialog = false },
            title = { Text("Save Snippet") },
            text = {
                TextField(
                    value = newSnippetTitle,
                    onValueChange = { newSnippetTitle = it },
                    placeholder = { Text("Snippet title (e.g. Binary Search)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newSnippetTitle.isNotBlank()) {
                            viewModel.saveCurrentSnippet(newSnippetTitle.trim())
                            newSnippetTitle = ""
                            showSaveSnippetDialog = false
                        }
                    }
                ) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showSaveSnippetDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Packs Manager Dialog
    if (showPacksDialog) {
        AlertDialog(
            onDismissRequest = { showPacksDialog = false },
            title = { Text("Language Packs", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    PackItem(name = "C Engine", details = "libtcc (in-process JIT) • ~1.4 MB", status = "Installed")
                    Spacer(modifier = Modifier.height(8.dp))
                    PackItem(name = "Python Engine", details = "CPython 3.10 + Stdlib • ~7.8 MB", status = "Installed")
                    Spacer(modifier = Modifier.height(8.dp))
                    PackItem(name = "Java Engine", details = "ECJ Compiler + D8 Dex • ~9.3 MB", status = "Installed")
                    Spacer(modifier = Modifier.height(8.dp))
                    PackItem(name = "C++ Engine", details = "Clang + libc++ sysroot • Built-in", status = "Installed")
                }
            },
            confirmButton = {
                TextButton(onClick = { showPacksDialog = false }) {
                    Text("Close")
                }
            }
        )
    }

    // Settings Dialog
    if (showSettingsDialog) {
        AlertDialog(
            onDismissRequest = { showSettingsDialog = false },
            title = { Text("Settings", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Execution Timeout: ${timeoutSeconds}s", fontWeight = FontWeight.Medium, fontSize = 13.sp)
                    Row(modifier = Modifier.padding(vertical = 4.dp)) {
                        listOf(5, 10, 20, 30).forEach { sec ->
                            FilterChip(
                                selected = timeoutSeconds == sec,
                                onClick = { viewModel.setTimeout(sec) },
                                label = { Text("${sec}s") },
                                modifier = Modifier.padding(end = 6.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text("Editor Font Size: ${fontSizeSp.toInt()}sp", fontWeight = FontWeight.Medium, fontSize = 13.sp)
                    Row(modifier = Modifier.padding(vertical = 4.dp)) {
                        listOf(12f, 14f, 16f, 18f).forEach { size ->
                            FilterChip(
                                selected = fontSizeSp == size,
                                onClick = { viewModel.setFontSize(size) },
                                label = { Text("${size.toInt()}sp") },
                                modifier = Modifier.padding(end = 6.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "OfflineCode is 100% offline, zero trackers, open source.",
                        color = Color.Gray,
                        fontSize = 11.sp
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showSettingsDialog = false }) {
                    Text("Done")
                }
            }
        )
    }
}

@Composable
fun PackItem(name: String, details: String, status: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF262626), RoundedCornerShape(6.dp))
            .padding(10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Text(text = details, color = Color.Gray, fontSize = 11.sp)
        }
        val isInstalled = status == "Installed"
        Box(
            modifier = Modifier
                .background(
                    if (isInstalled) Color(0xFF1B5E20) else Color(0xFF37474F),
                    RoundedCornerShape(4.dp)
                )
                .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Text(
                text = status,
                color = Color.White,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

