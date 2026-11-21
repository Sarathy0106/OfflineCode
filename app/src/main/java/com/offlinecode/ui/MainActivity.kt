package com.offlinecode.ui

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.offlinecode.core.Snippet
import com.offlinecode.ui.theme.EditorTheme
import com.offlinecode.ui.theme.OfflineCodeTheme
import com.offlinecode.ui.theme.PrimaryBlue

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        intent?.data?.let { uri ->
            viewModel.openFileFromUri(this, uri)
        }

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

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        intent.data?.let { uri ->
            viewModel.openFileFromUri(this, uri)
        }
    }
}

@Composable
fun CompactIconButton(
    onClick: () -> Unit,
    icon: ImageVector,
    desc: String,
    tint: Color = Color.LightGray,
    modifier: Modifier = Modifier
) {
    IconButton(
        onClick = onClick,
        modifier = modifier.size(32.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = desc,
            tint = tint,
            modifier = Modifier.size(17.dp)
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    viewModel: MainViewModel,
    onShare: (String, String) -> Unit
) {
    val context = LocalContext.current
    val selectedLanguage by viewModel.selectedLanguage.collectAsState()
    val editorValue by viewModel.editorValue.collectAsState()
    val runEvents by viewModel.runEvents.collectAsState()
    val isRunning by viewModel.isRunning.collectAsState()
    val fontSizeSp by viewModel.fontSizeSp.collectAsState()
    val timeoutSeconds by viewModel.timeoutSeconds.collectAsState()
    val savedSnippets by viewModel.savedSnippets.collectAsState()
    val currentFileName by viewModel.currentFileName.collectAsState()
    val selectedTheme by viewModel.selectedTheme.collectAsState()
    val cppOptimization by viewModel.cppOptimization.collectAsState()
    val cppWarnings by viewModel.cppWarnings.collectAsState()

    // Find & Replace
    val isSearchOpen by viewModel.isSearchOpen.collectAsState()
    val isReplaceOpen by viewModel.isReplaceOpen.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val replaceQuery by viewModel.replaceQuery.collectAsState()
    val matchIndices by viewModel.matchIndices.collectAsState()
    val currentMatchIndex by viewModel.currentMatchIndex.collectAsState()

    var showSnippetsDialog by remember { mutableStateOf(false) }
    var showPacksDialog by remember { mutableStateOf(false) }
    var showSettingsDialog by remember { mutableStateOf(false) }
    var showSaveSnippetDialog by remember { mutableStateOf(false) }
    var newSnippetTitle by remember { mutableStateOf("") }

    val openFileLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        if (uri != null) {
            viewModel.openFileFromUri(context, uri)
        }
    }

    val saveFileLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("*/*")
    ) { uri: Uri? ->
        if (uri != null) {
            viewModel.saveFileToUri(context, uri)
        }
    }

    val languages = listOf(
        "python" to "Python",
        "c" to "C",
        "java" to "Java",
        "cpp" to "C++"
    )

    Scaffold(
        topBar = {
            // Ultra-compact Top Bar with Status Bar Padding
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF1E1E1E))
                    .statusBarsPadding()
                    .height(46.dp)
                    .padding(horizontal = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Title and Active File Name
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f, fill = false)
                ) {
                    Text(
                        text = "OfflineCode",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = Color.White,
                        maxLines = 1,
                        softWrap = false
                    )
                    if (currentFileName != null) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFF2D2D2D))
                                .padding(horizontal = 5.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = currentFileName!!,
                                fontSize = 11.sp,
                                color = PrimaryBlue,
                                fontFamily = FontFamily.Monospace,
                                maxLines = 1,
                                softWrap = false
                            )
                        }
                    }
                }

                // Compact Action Buttons
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CompactIconButton(onClick = { viewModel.undo() }, icon = Icons.AutoMirrored.Filled.Undo, desc = "Undo")
                    CompactIconButton(onClick = { viewModel.redo() }, icon = Icons.AutoMirrored.Filled.Redo, desc = "Redo")
                    CompactIconButton(
                        onClick = { openFileLauncher.launch(arrayOf("*/*", "text/*")) },
                        icon = Icons.Default.FileOpen,
                        desc = "Open File"
                    )
                    CompactIconButton(
                        onClick = { saveFileLauncher.launch(viewModel.getDefaultFileName()) },
                        icon = Icons.Default.Save,
                        desc = "Save to Device"
                    )
                    CompactIconButton(onClick = { showSnippetsDialog = true }, icon = Icons.Default.Folder, desc = "Snippets")
                    CompactIconButton(onClick = { showPacksDialog = true }, icon = Icons.Default.Extension, desc = "Packs")
                    CompactIconButton(onClick = { showSettingsDialog = true }, icon = Icons.Default.Settings, desc = "Settings")
                    CompactIconButton(onClick = { onShare(editorValue.text, selectedLanguage) }, icon = Icons.Default.Share, desc = "Share")
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Secondary Control Bar: Language selector, Search/Format actions, and Run/Stop button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(38.dp)
                    .background(Color(0xFF252526))
                    .padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Language Chips
                Row(
                    modifier = Modifier
                        .weight(1f, fill = false)
                        .horizontalScroll(rememberScrollState()),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    languages.forEach { (id, label) ->
                        val isSelected = selectedLanguage == id
                        Box(
                            modifier = Modifier
                                .padding(end = 5.dp)
                                .clip(RoundedCornerShape(5.dp))
                                .background(if (isSelected) PrimaryBlue else Color(0xFF333333))
                                .clickable { viewModel.selectLanguage(id) }
                                .padding(horizontal = 9.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = label,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) Color.White else Color.LightGray
                            )
                        }
                    }
                }

                // Quick Tools & Run / Stop Button
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Find & Replace Toggle
                    CompactIconButton(
                        onClick = { viewModel.toggleSearch() },
                        icon = Icons.Default.Search,
                        desc = "Find and Replace",
                        tint = if (isSearchOpen) PrimaryBlue else Color.LightGray
                    )

                    // Format Code Action
                    CompactIconButton(
                        onClick = { viewModel.formatCode() },
                        icon = Icons.Default.AutoFixHigh,
                        desc = "Auto Format Code",
                        tint = Color.LightGray
                    )

                    Spacer(modifier = Modifier.width(4.dp))

                    if (isRunning) {
                        Button(
                            onClick = { viewModel.stopCode() },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD32F2F)),
                            shape = RoundedCornerShape(5.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp),
                            modifier = Modifier.height(28.dp)
                        ) {
                            Icon(Icons.Default.Stop, contentDescription = "Stop", modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Stop", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        Button(
                            onClick = { viewModel.runCode() },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                            shape = RoundedCornerShape(5.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp),
                            modifier = Modifier.height(28.dp)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = "Run", modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Run", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Find & Replace Bar (Collapsible)
            if (isSearchOpen) {
                SearchBar(
                    searchQuery = searchQuery,
                    onSearchQueryChange = { viewModel.updateSearchQuery(it) },
                    replaceQuery = replaceQuery,
                    onReplaceQueryChange = { viewModel.updateReplaceQuery(it) },
                    isReplaceOpen = isReplaceOpen,
                    onToggleReplace = { viewModel.toggleReplace() },
                    matchCount = matchIndices.size,
                    currentMatchIndex = currentMatchIndex,
                    onFindNext = { viewModel.findNext() },
                    onFindPrevious = { viewModel.findPrevious() },
                    onReplaceCurrent = { viewModel.replaceCurrent() },
                    onReplaceAll = { viewModel.replaceAll() },
                    onClose = { viewModel.toggleSearch(false) }
                )
            }

            // Editor Pane (Occupies maximum available space)
            EditorView(
                textFieldValue = editorValue,
                onValueChange = { viewModel.onEditorChange(it) },
                language = selectedLanguage,
                fontSizeSp = fontSizeSp,
                theme = selectedTheme,
                searchQuery = if (isSearchOpen) searchQuery else "",
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            )

            // Symbol Row (Keyboard accessory with quick comment & format)
            SymbolRow(
                language = selectedLanguage,
                onInsertSymbol = { symbol -> viewModel.insertSymbol(symbol) },
                onToggleComment = { viewModel.toggleComment() },
                onFormatCode = { viewModel.formatCode() }
            )

            // Collapsible Console Panel with Live Execution Stats
            ConsolePanel(
                events = runEvents,
                isRunning = isRunning,
                onSendStdin = { viewModel.sendStdin(it) },
                onStop = { viewModel.stopCode() },
                onClear = { viewModel.clearConsole() },
                onJumpToLine = { line, col -> viewModel.jumpToLine(line, col) },
                modifier = Modifier.fillMaxWidth()
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
                            newSnippetTitle = "code" + viewModel.getExtensionForLanguage(selectedLanguage)
                            showSaveSnippetDialog = true
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Save Current Code to Snippets")
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
                Column {
                    Text(
                        text = "File extension (${viewModel.getExtensionForLanguage(selectedLanguage)}) will be saved automatically.",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TextField(
                        value = newSnippetTitle,
                        onValueChange = { newSnippetTitle = it },
                        placeholder = { Text("e.g. solution${viewModel.getExtensionForLanguage(selectedLanguage)}") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
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

    // Comprehensive Settings Dialog: Themes, Timeout, Font Size, Compiler Flags
    if (showSettingsDialog) {
        AlertDialog(
            onDismissRequest = { showSettingsDialog = false },
            title = { Text("Settings", fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                ) {
                    // 1. Editor Color Theme
                    Text("Editor Theme", fontWeight = FontWeight.Medium, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        EditorTheme.entries.forEach { theme ->
                            val selected = selectedTheme == theme
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (selected) PrimaryBlue else Color(0xFF2D2D2D))
                                    .clickable { viewModel.setTheme(theme) }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = theme.displayName,
                                    fontSize = 11.sp,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (selected) Color.White else Color.LightGray,
                                    maxLines = 1,
                                    softWrap = false
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 2. Execution Timeout
                    Text("Execution Timeout: ${timeoutSeconds}s", fontWeight = FontWeight.Medium, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf(10, 20, 30, 60).forEach { sec ->
                            val selected = timeoutSeconds == sec
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (selected) PrimaryBlue else Color(0xFF2D2D2D))
                                    .clickable { viewModel.setTimeout(sec) }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${sec}s",
                                    fontSize = 13.sp,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (selected) Color.White else Color.LightGray,
                                    maxLines = 1,
                                    softWrap = false
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 3. Editor Font Size
                    Text("Editor Font Size: ${fontSizeSp.toInt()}sp", fontWeight = FontWeight.Medium, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf(12f, 14f, 16f, 18f).forEach { size ->
                            val selected = fontSizeSp == size
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (selected) PrimaryBlue else Color(0xFF2D2D2D))
                                    .clickable { viewModel.setFontSize(size) }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${size.toInt()}sp",
                                    fontSize = 13.sp,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (selected) Color.White else Color.LightGray,
                                    maxLines = 1,
                                    softWrap = false
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 4. C/C++ Compiler Optimization Flags
                    Text("C/C++ Optimization Flag", fontWeight = FontWeight.Medium, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("-O0" to "-O0 (Debug)", "-O2" to "-O2 (Fast)").forEach { (flag, label) ->
                            val selected = cppOptimization == flag
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (selected) PrimaryBlue else Color(0xFF2D2D2D))
                                    .clickable { viewModel.setCppOptimization(flag) }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = label,
                                    fontSize = 12.sp,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (selected) Color.White else Color.LightGray,
                                    maxLines = 1,
                                    softWrap = false
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 5. C/C++ Warnings Flag
                    Text("C/C++ Compiler Warnings (-Wall)", fontWeight = FontWeight.Medium, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf(false to "Standard", true to "-Wall (Strict)").forEach { (enabled, label) ->
                            val selected = cppWarnings == enabled
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (selected) PrimaryBlue else Color(0xFF2D2D2D))
                                    .clickable { viewModel.setCppWarnings(enabled) }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = label,
                                    fontSize = 12.sp,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (selected) Color.White else Color.LightGray,
                                    maxLines = 1,
                                    softWrap = false
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
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
