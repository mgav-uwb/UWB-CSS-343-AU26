// CSS 343 - topic program: counting how often a loop body runs.
// Each function returns the exact number of times its innermost statement
// executes; main prints the count beside the closed form.
//
//   build:  g++ -std=c++17 -O2 loops.cpp -o loops
//   run:    ./loops
#include <iostream>
using namespace std;

long single(long n) {                // n
    long ops = 0;
    for (long i = 0; i < n; i++) ops++;
    return ops;
}

long square(long n) {                // n * n
    long ops = 0;
    for (long i = 0; i < n; i++)
        for (long j = 0; j < n; j++) ops++;
    return ops;
}

long triangle(long n) {              // n(n-1)/2
    long ops = 0;
    for (long i = 0; i < n; i++)
        for (long j = i + 1; j < n; j++) ops++;
    return ops;
}

long halving(long n) {               // floor(log2 n) + 1
    long ops = 0;
    for (long i = n; i >= 1; i /= 2) ops++;
    return ops;
}

long mixed(long n) {                 // n * (floor(log2 n) + 1)
    long ops = 0;
    for (long i = 0; i < n; i++)
        for (long j = n; j >= 1; j /= 2) ops++;
    return ops;
}

long sequence(long n) {              // n + n*n : consecutive loops ADD
    long ops = 0;
    for (long i = 0; i < n; i++) ops++;
    for (long i = 0; i < n; i++)
        for (long j = 0; j < n; j++) ops++;
    return ops;
}

long triple(long n) {                // n(n-1)(n-2)/6
    long ops = 0;
    for (long i = 0; i < n; i++)
        for (long j = i + 1; j < n; j++)
            for (long k = j + 1; k < n; k++) ops++;
    return ops;
}

long floorLog2(long n) { long k = 0; while (n > 1) { n /= 2; k++; } return k; }

int main() {
    cout << "n\tsingle\tsquare\ttriangle\thalving\tmixed\tsequence\ttriple\n";
    for (long n : {5, 8, 16, 100, 1000}) {
        cout << n << "\t" << single(n) << "\t" << square(n) << "\t" << triangle(n)
             << "\t\t" << halving(n) << "\t" << mixed(n) << "\t" << sequence(n)
             << "\t\t" << triple(n) << "\n";
        bool ok = single(n) == n && square(n) == n * n
               && triangle(n) == n * (n - 1) / 2
               && halving(n) == floorLog2(n) + 1
               && mixed(n) == n * (floorLog2(n) + 1)
               && sequence(n) == n + n * n
               && triple(n) == n * (n - 1) * (n - 2) / 6;
        if (!ok) { cout << "MISMATCH with the closed forms at n = " << n << "\n"; return 1; }
    }
    cout << "every count matches its closed form\n";
    return 0;
}
