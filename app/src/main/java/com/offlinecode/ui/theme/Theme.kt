package com.offlinecode.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryBlue,
    secondary = AccentCyan,
    background = DarkBackground,
    surface = DarkSurface,
    surfaceVariant = DarkSurfaceVariant,
    onPrimary = Color.White,
    onBackground = Color(0xFFD4D4D4),
    onSurface = Color(0xFFD4D4D4)
)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryBlue,
    secondary = AccentCyan,
    background = Color(0xFFFFFFFF),
    surface = Color(0xFFF3F3F3),
    surfaceVariant = Color(0xFFE5E5E5),
    onPrimary = Color.White,
    onBackground = Color(0xFF222222),
    onSurface = Color(0xFF222222)
)

@Composable
fun OfflineCodeTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
