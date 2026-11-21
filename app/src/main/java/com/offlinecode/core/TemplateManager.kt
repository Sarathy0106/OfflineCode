package com.offlinecode.core

object TemplateManager {
    fun getTemplate(languageId: String): String {
        return when (languageId) {
            "python" -> """# Python 3.10 Offline
def main():
    name = input("Enter your name: ")
    print(f"Hello, {name}! Welcome to Python offline.")

if __name__ == "__main__":
    main()
""".trimIndent()

            "c" -> """#include <stdio.h>

int main() {
    int num;
    printf("Enter a number: ");
    scanf("%d", &num);
    printf("Square of %d is %d\n", num, num * num);
    return 0;
}
""".trimIndent()

            "java" -> """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter a number: ");
        int x = sc.nextInt();
        System.out.println("Cube of " + x + " is " + (x * x * x));
    }
}
""".trimIndent()

            "cpp" -> """#include <iostream>
using namespace std;

int main() {
    int num, flag = 0;
    cin >> num;

    if (num <= 1) {
        cout << "It is not prime number";
    } else {
        for (int i = 2; i < num; i++) {
            if (num % i == 0) {
                flag++;
                break;
            }
        }
    }

    if (flag == 0) {
        cout << num << " is prime number";
    } else {
        cout << num << " is not prime number";
    }
    return 0;
}
""".trimIndent()

            else -> ""
        }
    }
}
