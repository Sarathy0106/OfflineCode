package com.offlinecode.core

object TemplateManager {
    fun getTemplate(languageId: String): String {
        return when (languageId) {
            "python" -> """# Python 3.10 Offline
def main():
    print("Hello from Python!")
    name = "World"
    print(f"Welcome, {name}!")

if __name__ == "__main__":
    main()
""".trimIndent()

            "c" -> """#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("Hello from C (libtcc)!\n");
    int a = 15;
    int b = 27;
    printf("Result: %d + %d = %d\n", a, b, a + b);
    return 0;
}
""".trimIndent()

            "java" -> """// Compiled with ECJ + D8 on Android ART
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        int x = 21 * 2;
        System.out.println("Calculation result: " + x);
    }
}
""".trimIndent()

            "cpp" -> """#include <iostream>

int main() {
    std::cout << "Hello from C++!" << std::endl;
    return 0;
}
""".trimIndent()

            else -> ""
        }
    }
}
