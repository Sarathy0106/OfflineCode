package com.offlinecode.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.offlinecode.ui.theme.PrimaryBlue

@Composable
fun SymbolRow(
    language: String,
    onInsertSymbol: (String) -> Unit,
    onToggleComment: () -> Unit,
    onFormatCode: () -> Unit,
    modifier: Modifier = Modifier
) {
    val commentSymbol = if (language.lowercase() == "python") "#" else "//"

    val symbols = listOf(
        "Tab" to "    ",
        "{" to "{",
        "}" to "}",
        "(" to "(",
        ")" to ")",
        "[" to "[",
        "]" to "]",
        ";" to ";",
        ":" to ":",
        "\"" to "\"",
        "'" to "'",
        "=" to "=",
        "+" to "+",
        "-" to "-",
        "*" to "*",
        "/" to "/",
        "<" to "<",
        ">" to ">",
        "!" to "!",
        "&" to "&",
        "|" to "|",
        "#" to "#",
        "_" to "_",
        "\\" to "\\"
    )

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(horizontal = 2.dp, vertical = 2.dp)
            .horizontalScroll(rememberScrollState()),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Comment / Uncomment quick action button
        Box(
            modifier = Modifier
                .padding(horizontal = 2.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(Color(0xFF333333))
                .clickable { onToggleComment() }
                .padding(horizontal = 8.dp, vertical = 4.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = commentSymbol,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = Color(0xFF4EC9B0)
            )
        }

        // Format Code quick action button
        Box(
            modifier = Modifier
                .padding(horizontal = 2.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(Color(0xFF333333))
                .clickable { onFormatCode() }
                .padding(horizontal = 8.dp, vertical = 4.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "fmt",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = PrimaryBlue
            )
        }

        // Standard Symbols
        symbols.forEach { (label, value) ->
            Box(
                modifier = Modifier
                    .padding(horizontal = 2.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .clickable { onInsertSymbol(value) }
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = label,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}
