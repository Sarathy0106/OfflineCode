package com.offlinecode.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.offlinecode.ui.theme.DarkGutter
import com.offlinecode.ui.theme.DarkLineNumber

@Composable
fun EditorView(
    textFieldValue: TextFieldValue,
    onValueChange: (TextFieldValue) -> Unit,
    language: String,
    fontSizeSp: Float,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    val highlighter = remember(language) { SyntaxHighlighter(language) }

    val lines = remember(textFieldValue.text) {
        textFieldValue.text.lines()
    }
    val lineCount = remember(lines) { lines.size }

    // Intercept Enter for auto-indent
    fun handleTextChange(newValue: TextFieldValue) {
        val oldText = textFieldValue.text
        val newText = newValue.text

        // Check if Enter was pressed (length increased by 1 and char at cursor-1 is '\n')
        if (newText.length == oldText.length + 1 &&
            newValue.selection.start > 0 &&
            newText[newValue.selection.start - 1] == '\n'
        ) {
            val cursor = newValue.selection.start
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

        onValueChange(newValue)
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(scrollState)
    ) {
        // Line Numbers Gutter
        Column(
            modifier = Modifier
                .background(DarkGutter)
                .padding(horizontal = 10.dp, vertical = 12.dp)
        ) {
            for (i in 1..maxOf(1, lineCount)) {
                Text(
                    text = "$i",
                    color = DarkLineNumber,
                    fontFamily = FontFamily.Monospace,
                    fontSize = fontSizeSp.sp,
                    lineHeight = (fontSizeSp * 1.45f).sp
                )
            }
        }

        Spacer(modifier = Modifier.width(6.dp))

        // Editor Input Area
        BasicTextField(
            value = textFieldValue,
            onValueChange = ::handleTextChange,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp, horizontal = 6.dp),
            textStyle = TextStyle(
                fontFamily = FontFamily.Monospace,
                fontSize = fontSizeSp.sp,
                lineHeight = (fontSizeSp * 1.45f).sp,
                color = MaterialTheme.colorScheme.onBackground
            ),
            cursorBrush = SolidColor(MaterialTheme.colorScheme.primary),
            visualTransformation = highlighter
        )
    }
}
