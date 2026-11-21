package com.offlinecode.ui.theme

import androidx.compose.ui.graphics.Color

enum class EditorTheme(
    val id: String,
    val displayName: String,
    val background: Color,
    val gutterBackground: Color,
    val lineNumberColor: Color,
    val keywordColor: Color,
    val stringColor: Color,
    val numberColor: Color,
    val commentColor: Color,
    val preprocessorColor: Color
) {
    ONE_DARK(
        id = "onedark",
        displayName = "One Dark",
        background = Color(0xFF1E1E1E),
        gutterBackground = Color(0xFF1E1E1E),
        lineNumberColor = Color(0xFF858585),
        keywordColor = Color(0xFFC586C0),
        stringColor = Color(0xFFCE9178),
        numberColor = Color(0xFFB5CEA8),
        commentColor = Color(0xFF6A9955),
        preprocessorColor = Color(0xFF4EC9B0)
    ),
    DRACULA(
        id = "dracula",
        displayName = "Dracula",
        background = Color(0xFF282A36),
        gutterBackground = Color(0xFF21222C),
        lineNumberColor = Color(0xFF6272A4),
        keywordColor = Color(0xFFFF79C6),
        stringColor = Color(0xFFF1FA8C),
        numberColor = Color(0xFFBD93F9),
        commentColor = Color(0xFF6272A4),
        preprocessorColor = Color(0xFF8BE9FD)
    ),
    MONOKAI(
        id = "monokai",
        displayName = "Monokai",
        background = Color(0xFF272822),
        gutterBackground = Color(0xFF1E1F1C),
        lineNumberColor = Color(0xFF90908A),
        keywordColor = Color(0xFFF92672),
        stringColor = Color(0xFFE6DB74),
        numberColor = Color(0xFFAE81FF),
        commentColor = Color(0xFF75715E),
        preprocessorColor = Color(0xFF66D9EF)
    ),
    GITHUB_DARK(
        id = "github_dark",
        displayName = "GitHub",
        background = Color(0xFF0D1117),
        gutterBackground = Color(0xFF090D13),
        lineNumberColor = Color(0xFF6E7681),
        keywordColor = Color(0xFFFF7B72),
        stringColor = Color(0xFFA5D6FF),
        numberColor = Color(0xFF79C0FF),
        commentColor = Color(0xFF8B949E),
        preprocessorColor = Color(0xFFFFA657)
    )
}
