package com.offlinecode.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.offlinecode.core.RunEvent
import com.offlinecode.ui.theme.ConsoleStderr
import com.offlinecode.ui.theme.ConsoleStdout
import com.offlinecode.ui.theme.ConsoleSuccess

@Composable
fun ConsolePanel(
    events: List<RunEvent>,
    isRunning: Boolean,
    onSendStdin: (String) -> Unit,
    onStop: () -> Unit,
    onClear: () -> Unit,
    onJumpToLine: (Int, Int) -> Unit,
    onStdinFocusChanged: (Boolean) -> Unit = {},
    modifier: Modifier = Modifier
) {
    var stdinInput by remember { mutableStateOf("") }
    var isExpanded by remember { mutableStateOf(false) }
    var isInputFocused by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    val lastExit = remember(events) {
        events.findLast { it is RunEvent.Exit } as? RunEvent.Exit
    }

    // Auto-expand and scroll on execution
    LaunchedEffect(isRunning) {
        if (isRunning) {
            isExpanded = true
        }
    }

    LaunchedEffect(events.size) {
        if (events.isNotEmpty()) {
            listState.animateScrollToItem(events.size - 1)
        }
    }

    LaunchedEffect(isInputFocused) {
        if (isInputFocused && events.isNotEmpty()) {
            listState.animateScrollToItem(events.size - 1)
        }
    }

    val panelHeight = when {
        !isExpanded -> 36.dp
        isInputFocused -> 250.dp
        else -> 220.dp
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .height(panelHeight)
            .background(Color(0xFF181818))
    ) {
        // Console Header (Click to Toggle Expand/Collapse)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(36.dp)
                .background(Color(0xFF222222))
                .clickable { isExpanded = !isExpanded }
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = if (isExpanded) Icons.Default.KeyboardArrowDown else Icons.Default.KeyboardArrowUp,
                    contentDescription = if (isExpanded) "Collapse" else "Expand",
                    tint = Color.LightGray,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "CONSOLE",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.LightGray,
                    letterSpacing = 1.sp
                )

                if (isRunning) {
                    Spacer(modifier = Modifier.width(8.dp))
                    CircularProgressIndicator(
                        modifier = Modifier.size(12.dp),
                        strokeWidth = 2.dp,
                        color = Color(0xFF00E5FF)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Running...",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF00E5FF)
                    )
                } else if (lastExit != null) {
                    // Execution Stats badge
                    Spacer(modifier = Modifier.width(8.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(if (lastExit.code == 0) Color(0xFF1B5E20) else Color(0xFFB71C1C))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = if (lastExit.code == 0) "✓ ${lastExit.millis}ms" else "Exit ${lastExit.code} (${lastExit.millis}ms)",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                } else if (!isExpanded && events.isNotEmpty()) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "• Tap to view",
                        fontSize = 11.sp,
                        color = Color.Gray
                    )
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                if (isRunning) {
                    IconButton(
                        onClick = onStop,
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Stop,
                            contentDescription = "Stop",
                            tint = Color(0xFFE51400),
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
                IconButton(
                    onClick = onClear,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Clear,
                        contentDescription = "Clear",
                        tint = Color.Gray,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }

        if (isExpanded) {
            HorizontalDivider(color = Color(0xFF333333))

            // Prominent Live Status Bar when program is running
            if (isRunning) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF0F263B))
                        .padding(horizontal = 12.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(10.dp),
                        strokeWidth = 2.dp,
                        color = Color(0xFF00E5FF)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "● Program active • Waiting for input below if required",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF00E5FF),
                        fontFamily = FontFamily.Monospace
                    )
                }
                HorizontalDivider(color = Color(0xFF1E4E79))
            }

            // Output Area
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            ) {
                if (events.isEmpty() && !isRunning) {
                    item {
                        Text(
                            text = "Tap 'Run' to compile and execute offline.",
                            color = Color.DarkGray,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                }

                items(events) { event ->
                    when (event) {
                        is RunEvent.Stdout -> {
                            val isUserInput = event.text.startsWith("> ")
                            Text(
                                text = event.text,
                                color = if (isUserInput) Color(0xFF00E5FF) else ConsoleStdout,
                                fontWeight = if (isUserInput) FontWeight.Bold else FontWeight.Normal,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 13.sp
                            )
                        }
                        is RunEvent.Stderr -> {
                            Text(
                                text = event.text,
                                color = ConsoleStderr,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 13.sp
                            )
                        }
                        is RunEvent.CompileError -> {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 2.dp)
                                    .clickable { onJumpToLine(event.line, event.col) }
                            ) {
                                Text(
                                    text = "Line ${event.line}:${event.col}: ",
                                    color = Color(0xFFCCA700),
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 13.sp
                                )
                                Text(
                                    text = event.msg,
                                    color = ConsoleStderr,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 13.sp
                                )
                            }
                        }
                        is RunEvent.Exit -> {
                            Text(
                                text = "\n[Process exited with code ${event.code} in ${event.millis}ms]",
                                color = if (event.code == 0) ConsoleSuccess else ConsoleStderr,
                                fontWeight = FontWeight.SemiBold,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(vertical = 4.dp)
                            )
                        }
                    }
                }
            }

            // Quick Input Accessory Chips (only visible when running or input is focused)
            if (isRunning || isInputFocused) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF1E1E1E))
                        .padding(horizontal = 8.dp, vertical = 3.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "Quick:",
                        fontSize = 10.sp,
                        color = Color.Gray,
                        fontWeight = FontWeight.Bold
                    )
                    listOf("0", "1", "2", "↵", "Space", "Clear").forEach { chip ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFF2A2A2A))
                                .clickable {
                                    when (chip) {
                                        "↵" -> {
                                            if (stdinInput.isNotEmpty()) {
                                                onSendStdin("$stdinInput\n")
                                                stdinInput = ""
                                            } else {
                                                onSendStdin("\n")
                                            }
                                        }
                                        "Space" -> stdinInput += " "
                                        "Clear" -> stdinInput = ""
                                        else -> stdinInput += chip
                                    }
                                }
                                .padding(horizontal = 7.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = chip,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (chip == "↵") Color(0xFF00E5FF) else Color.White,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }

            // Stdin Interactive Input Field
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF222222))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextField(
                    value = stdinInput,
                    onValueChange = { stdinInput = it },
                    placeholder = {
                        Text(
                            text = if (isRunning) "Type input (e.g. 17) & press ↵..." else "Enter stdin input...",
                            fontSize = 12.sp,
                            color = if (isRunning) Color(0xFFAAAAAA) else Color.Gray
                        )
                    },
                    modifier = Modifier
                        .weight(1f)
                        .height(46.dp)
                        .onFocusChanged { focusState ->
                            isInputFocused = focusState.isFocused
                            onStdinFocusChanged(focusState.isFocused)
                        }
                        .then(
                            if (isRunning) {
                                Modifier.border(
                                    BorderStroke(1.5.dp, Color(0xFF00E5FF)),
                                    RoundedCornerShape(6.dp)
                                )
                            } else {
                                Modifier
                            }
                        ),
                    textStyle = MaterialTheme.typography.bodyMedium.copy(
                        fontFamily = FontFamily.Monospace,
                        fontSize = 13.sp,
                        color = Color.White
                    ),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(onSend = {
                        if (stdinInput.isNotEmpty()) {
                            onSendStdin("$stdinInput\n")
                            stdinInput = ""
                        } else {
                            onSendStdin("\n")
                        }
                    }),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color(0xFF1E1E1E),
                        unfocusedContainerColor = Color(0xFF1E1E1E),
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent
                    ),
                    shape = RoundedCornerShape(6.dp)
                )

                Spacer(modifier = Modifier.width(6.dp))

                IconButton(
                    onClick = {
                        if (stdinInput.isNotEmpty()) {
                            onSendStdin("$stdinInput\n")
                            stdinInput = ""
                        } else {
                            onSendStdin("\n")
                        }
                    },
                    modifier = Modifier
                        .size(40.dp)
                        .background(if (isRunning) Color(0xFF007ACC) else Color(0xFF444444), RoundedCornerShape(6.dp))
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = "Send stdin",
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

