package com.offlinecode.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.offlinecode.ui.theme.PrimaryBlue

@Composable
fun SearchBar(
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    replaceQuery: String,
    onReplaceQueryChange: (String) -> Unit,
    isReplaceOpen: Boolean,
    onToggleReplace: () -> Unit,
    matchCount: Int,
    currentMatchIndex: Int,
    onFindNext: () -> Unit,
    onFindPrevious: () -> Unit,
    onReplaceCurrent: () -> Unit,
    onReplaceAll: () -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(Color(0xFF252526))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        // Row 1: Search Input + Navigation + Replace Toggle + Close
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(34.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Search Input Field
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(30.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color(0xFF1E1E1E))
                    .padding(horizontal = 8.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                if (searchQuery.isEmpty()) {
                    Text("Find...", fontSize = 12.sp, color = Color.Gray, fontFamily = FontFamily.Monospace)
                }
                BasicTextField(
                    value = searchQuery,
                    onValueChange = onSearchQueryChange,
                    modifier = Modifier.fillMaxWidth(),
                    textStyle = TextStyle(
                        color = Color.White,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace
                    ),
                    singleLine = true,
                    cursorBrush = SolidColor(PrimaryBlue),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(onSearch = { onFindNext() })
                )
            }

            Spacer(modifier = Modifier.width(6.dp))

            // Match count badge
            if (searchQuery.isNotEmpty()) {
                val matchText = if (matchCount > 0) "${currentMatchIndex + 1}/$matchCount" else "0"
                Text(
                    text = matchText,
                    fontSize = 11.sp,
                    color = if (matchCount > 0) Color.LightGray else Color(0xFFF44336),
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.padding(horizontal = 4.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
            }

            // Up / Down navigation
            IconButton(
                onClick = onFindPrevious,
                enabled = matchCount > 0,
                modifier = Modifier.size(28.dp)
            ) {
                Icon(
                    Icons.Default.KeyboardArrowUp,
                    contentDescription = "Previous Match",
                    tint = if (matchCount > 0) Color.White else Color.DarkGray,
                    modifier = Modifier.size(18.dp)
                )
            }

            IconButton(
                onClick = onFindNext,
                enabled = matchCount > 0,
                modifier = Modifier.size(28.dp)
            ) {
                Icon(
                    Icons.Default.KeyboardArrowDown,
                    contentDescription = "Next Match",
                    tint = if (matchCount > 0) Color.White else Color.DarkGray,
                    modifier = Modifier.size(18.dp)
                )
            }

            // Toggle Replace Bar
            IconButton(
                onClick = onToggleReplace,
                modifier = Modifier.size(28.dp)
            ) {
                Icon(
                    Icons.Default.FindReplace,
                    contentDescription = "Toggle Replace",
                    tint = if (isReplaceOpen) PrimaryBlue else Color.LightGray,
                    modifier = Modifier.size(16.dp)
                )
            }

            // Close Search
            IconButton(
                onClick = onClose,
                modifier = Modifier.size(28.dp)
            ) {
                Icon(
                    Icons.Default.Close,
                    contentDescription = "Close Find",
                    tint = Color.LightGray,
                    modifier = Modifier.size(16.dp)
                )
            }
        }

        // Row 2: Replace Mode (Visible when toggled)
        if (isReplaceOpen) {
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(34.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(30.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color(0xFF1E1E1E))
                        .padding(horizontal = 8.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    if (replaceQuery.isEmpty()) {
                        Text("Replace with...", fontSize = 12.sp, color = Color.Gray, fontFamily = FontFamily.Monospace)
                    }
                    BasicTextField(
                        value = replaceQuery,
                        onValueChange = onReplaceQueryChange,
                        modifier = Modifier.fillMaxWidth(),
                        textStyle = TextStyle(
                            color = Color.White,
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace
                        ),
                        singleLine = true,
                        cursorBrush = SolidColor(PrimaryBlue)
                    )
                }

                Spacer(modifier = Modifier.width(6.dp))

                // Replace Single Match Button
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(if (matchCount > 0) Color(0xFF333333) else Color(0xFF222222))
                        .clickable(enabled = matchCount > 0) { onReplaceCurrent() }
                        .padding(horizontal = 8.dp, vertical = 5.dp)
                ) {
                    Text(
                        text = "Replace",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = if (matchCount > 0) Color.White else Color.DarkGray
                    )
                }

                Spacer(modifier = Modifier.width(4.dp))

                // Replace All Matches Button
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(if (matchCount > 0) PrimaryBlue else Color(0xFF222222))
                        .clickable(enabled = matchCount > 0) { onReplaceAll() }
                        .padding(horizontal = 8.dp, vertical = 5.dp)
                ) {
                    Text(
                        text = "All",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (matchCount > 0) Color.White else Color.DarkGray
                    )
                }
            }
        }
    }
}
