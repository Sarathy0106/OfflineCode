package com.offlinecode.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.input.TransformedText
import androidx.compose.ui.text.input.VisualTransformation
import com.offlinecode.ui.theme.EditorTheme
import java.util.regex.Pattern

class SyntaxHighlighter(
    private val language: String,
    private val theme: EditorTheme = EditorTheme.ONE_DARK,
    private val searchQuery: String = ""
) : VisualTransformation {

    private val keywordPattern by lazy {
        val keywords = when (language) {
            "python" -> listOf(
                "def", "class", "import", "from", "as", "return", "if", "elif", "else",
                "while", "for", "in", "try", "except", "finally", "with", "lambda",
                "pass", "break", "continue", "yield", "async", "await", "True", "False", "None"
            )
            "c", "cpp" -> listOf(
                "int", "char", "float", "double", "void", "long", "short", "signed", "unsigned",
                "struct", "union", "enum", "typedef", "sizeof", "static", "extern", "const",
                "volatile", "auto", "register", "if", "else", "switch", "case", "default",
                "break", "continue", "return", "for", "do", "while", "goto", "class", "public",
                "private", "protected", "namespace", "using", "template", "typename", "new", "delete"
            )
            "java" -> listOf(
                "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class",
                "const", "continue", "default", "do", "double", "else", "enum", "extends", "final",
                "finally", "float", "for", "goto", "if", "implements", "import", "instanceof", "int",
                "interface", "long", "native", "new", "package", "private", "protected", "public",
                "return", "short", "static", "strictfp", "super", "switch", "synchronized", "this",
                "throw", "throws", "transient", "try", "void", "volatile", "while", "true", "false", "null"
            )
            else -> emptyList()
        }
        Pattern.compile("\\b(" + keywords.joinToString("|") + ")\\b")
    }

    private val stringPattern = Pattern.compile("(\"[^\"]*\"|'[^']*')")
    private val numberPattern = Pattern.compile("\\b\\d+(\\.\\d+)?\\b")
    private val preprocessorPattern = Pattern.compile("^\\s*#\\s*\\w+.*$", Pattern.MULTILINE)
    private val commentPattern by lazy {
        if (language == "python") {
            Pattern.compile("#.*$")
        } else {
            Pattern.compile("(//.*$|/\\*[\\s\\S]*?\\*/)", Pattern.MULTILINE)
        }
    }

    override fun filter(text: AnnotatedString): TransformedText {
        val raw = text.text
        val annotated = buildAnnotatedString {
            append(raw)

            // Numbers
            val numMatcher = numberPattern.matcher(raw)
            while (numMatcher.find()) {
                addStyle(SpanStyle(color = theme.numberColor), numMatcher.start(), numMatcher.end())
            }

            // Keywords
            val kwMatcher = keywordPattern.matcher(raw)
            while (kwMatcher.find()) {
                addStyle(SpanStyle(color = theme.keywordColor), kwMatcher.start(), kwMatcher.end())
            }

            // Preprocessor
            if (language == "c" || language == "cpp") {
                val prepMatcher = preprocessorPattern.matcher(raw)
                while (prepMatcher.find()) {
                    addStyle(SpanStyle(color = theme.preprocessorColor), prepMatcher.start(), prepMatcher.end())
                }
            }

            // Strings
            val strMatcher = stringPattern.matcher(raw)
            while (strMatcher.find()) {
                addStyle(SpanStyle(color = theme.stringColor), strMatcher.start(), strMatcher.end())
            }

            // Comments (highest syntax precedence)
            val commentMatcher = commentPattern.matcher(raw)
            while (commentMatcher.find()) {
                addStyle(SpanStyle(color = theme.commentColor), commentMatcher.start(), commentMatcher.end())
            }

            // Search query matches (highest overall precedence: bright yellow badge highlight)
            if (searchQuery.isNotEmpty()) {
                var searchIdx = raw.indexOf(searchQuery, ignoreCase = true)
                while (searchIdx != -1) {
                    val endIdx = searchIdx + searchQuery.length
                    addStyle(
                        SpanStyle(
                            background = Color(0xFFFFD54F),
                            color = Color(0xFF1E1E1E)
                        ),
                        searchIdx,
                        endIdx
                    )
                    searchIdx = raw.indexOf(searchQuery, searchIdx + 1, ignoreCase = true)
                }
            }
        }

        return TransformedText(annotated, OffsetMapping.Identity)
    }
}
