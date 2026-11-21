package com.offlinecode.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.offlinecode.ui.theme.EditorTheme

@Composable
fun EditorView(
    textFieldValue: TextFieldValue,
    onValueChange: (TextFieldValue) -> Unit,
    language: String,
    fontSizeSp: Float,
    theme: EditorTheme = EditorTheme.ONE_DARK,
    searchQuery: String = "",
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    val highlighter = remember(language, theme, searchQuery) {
        SyntaxHighlighter(language, theme, searchQuery)
    }

    val lines = remember(textFieldValue.text) {
        textFieldValue.text.lines()
    }
    val lineCount = remember(lines) { lines.size }

    // Handle auto-closing brackets, overtyping, auto-removal on backspace, and auto-indent
    fun handleTextChange(newValue: TextFieldValue) {
        val oldText = textFieldValue.text
        val newText = newValue.text
        val oldSelection = textFieldValue.selection
        val newSelection = newValue.selection

        // Case 1: Character insertion (length increased by 1)
        if (newText.length == oldText.length + 1 && newSelection.start > 0) {
            val insertedIndex = newSelection.start - 1
            val insertedChar = newText[insertedIndex]

            // 1A: Enter key pressed
            if (insertedChar == '\n') {
                val cursor = newSelection.start
                // Check if pressed between { and }
                if (cursor - 2 >= 0 && cursor < newText.length &&
                    newText[cursor - 2] == '{' && newText[cursor] == '}'
                ) {
                    val beforeCursor = newText.substring(0, cursor - 2)
                    val lastNewLine = beforeCursor.lastIndexOf('\n')
                    val prevLine = if (lastNewLine >= 0) beforeCursor.substring(lastNewLine + 1) else beforeCursor
                    val baseIndent = prevLine.takeWhile { it == ' ' || it == '\t' }
                    val innerIndent = baseIndent + "    "

                    val modified = newText.substring(0, cursor) + innerIndent + "\n" + baseIndent + newText.substring(cursor)
                    val newCursor = cursor + innerIndent.length
                    onValueChange(TextFieldValue(modified, TextRange(newCursor)))
                    return
                }

                // Standard auto-indent
                val beforeCursor = newText.substring(0, cursor - 1)
                val lastNewLine = beforeCursor.lastIndexOf('\n')
                val prevLine = if (lastNewLine >= 0) beforeCursor.substring(lastNewLine + 1) else beforeCursor

                val leadingSpaces = prevLine.takeWhile { it == ' ' || it == '\t' }
                val extraIndent = if (prevLine.trimEnd().endsWith("{") || prevLine.trimEnd().endsWith(":")) "    " else ""
                val indentToAdd = leadingSpaces + extraIndent

                if (indentToAdd.isNotEmpty()) {
                    val modifiedText = newText.substring(0, cursor) + indentToAdd + newText.substring(cursor)
                    val newCursor = cursor + indentToAdd.length
                    onValueChange(TextFieldValue(modifiedText, TextRange(newCursor)))
                    return
                }
            }

            // 1B: Overtyping closing character
            val closingChars = setOf(')', ']', '}', '"', '\'')
            if (closingChars.contains(insertedChar)) {
                if (oldSelection.collapsed && oldSelection.start < oldText.length &&
                    oldText[oldSelection.start] == insertedChar
                ) {
                    onValueChange(TextFieldValue(oldText, TextRange(oldSelection.start + 1)))
                    return
                }
            }

            // 1C: Auto-closing opening brackets and quotes
            val pairMap = mapOf(
                '(' to ')',
                '[' to ']',
                '{' to '}',
                '"' to '"',
                '\'' to '\''
            )
            if (pairMap.containsKey(insertedChar)) {
                val matchingClose = pairMap[insertedChar]!!
                val modifiedText = newText.substring(0, insertedIndex + 1) + matchingClose + newText.substring(insertedIndex + 1)
                val newCursor = insertedIndex + 1
                onValueChange(TextFieldValue(modifiedText, TextRange(newCursor)))
                return
            }
        }

        // Case 2: Backspace character deletion (length decreased by 1)
        if (newText.length == oldText.length - 1 && oldSelection.collapsed) {
            val deletedIndex = newSelection.start
            if (deletedIndex < oldText.length) {
                val deletedChar = oldText[deletedIndex]
                val nextChar = if (deletedIndex + 1 < oldText.length) oldText[deletedIndex + 1] else null

                val isPair = when (deletedChar) {
                    '(' -> nextChar == ')'
                    '[' -> nextChar == ']'
                    '{' -> nextChar == '}'
                    '"' -> nextChar == '"'
                    '\'' -> nextChar == '\''
                    else -> false
                }

                if (isPair) {
                    // Auto-remove matching closing bracket too
                    val modifiedText = newText.substring(0, deletedIndex) + newText.substring(deletedIndex + 1)
                    onValueChange(TextFieldValue(modifiedText, TextRange(deletedIndex)))
                    return
                }
            }
        }

        onValueChange(newValue)
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(theme.background)
            .verticalScroll(scrollState)
    ) {
        // Line Numbers Gutter
        Column(
            modifier = Modifier
                .background(theme.gutterBackground)
                .padding(horizontal = 6.dp, vertical = 6.dp)
        ) {
            for (i in 1..maxOf(1, lineCount)) {
                Text(
                    text = "$i",
                    color = theme.lineNumberColor,
                    fontFamily = FontFamily.Monospace,
                    fontSize = fontSizeSp.sp,
                    lineHeight = (fontSizeSp * 1.45f).sp
                )
            }
        }

        Spacer(modifier = Modifier.width(4.dp))

        // Editor Input Area
        BasicTextField(
            value = textFieldValue,
            onValueChange = ::handleTextChange,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 6.dp, horizontal = 4.dp),
            textStyle = TextStyle(
                fontFamily = FontFamily.Monospace,
                fontSize = fontSizeSp.sp,
                lineHeight = (fontSizeSp * 1.45f).sp,
                color = androidx.compose.ui.graphics.Color(0xFFD4D4D4)
            ),
            cursorBrush = SolidColor(theme.keywordColor),
            visualTransformation = highlighter
        )
    }
}
