// CSS 343 - topic program: 3-sum with loops, k-sum with recursion.
// Counts the sum checks each version performs and the calls the recursion
// makes, and compares both with the binomial coefficients.
//
//   build:  g++ -std=c++17 -O2 ksum.cpp -o ksum
//   run:    ./ksum
#include <iostream>
#include <iomanip>
#include <vector>
#include <chrono>
using namespace std;

long checks = 0;                     // how many sums were tested against the target
long calls  = 0;                     // how many times countK was entered

long count3(const vector<int>& a) {
    int n = a.size();
    long cnt = 0;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            for (int k = j + 1; k < n; k++) {
                checks++;
                if (a[i] + a[j] + a[k] == 0) cnt++;
            }
    return cnt;
}

// How many ways can we choose k elements from a[start..] that sum to target?
long countK(const vector<int>& a, int start, int k, long target) {
    calls++;
    if (k == 0) {
        checks++;
        return target == 0 ? 1 : 0;
    }
    long cnt = 0;
    for (int i = start; i < (int)a.size(); i++)
        cnt += countK(a, i + 1, k - 1, target - a[i]);
    return cnt;
}

long choose(long n, long k) {        // exact binomial coefficient
    if (k < 0 || k > n) return 0;
    long c = 1;
    for (long i = 1; i <= k; i++) c = c * (n - k + i) / i;
    return c;
}

// Deterministic test data: a hand-written generator, so every compiler and
// every machine produces the same n integers in [-100, 100] from the same seed.
vector<int> testData(int n, unsigned seed) {
    vector<int> a(n);
    for (int& x : a) {
        seed = seed * 1664525u + 1013904223u;
        x = (int)((seed >> 16) % 201) - 100;
    }
    return a;
}

int main() {
    vector<int> small = {-40, -20, -10, 0, 5, 10, 30, 40};
    checks = 0;
    long byLoops = count3(small);
    long loopChecks = checks;
    checks = calls = 0;
    long byRec = countK(small, 0, 3, 0);
    cout << "the 8-element instance:\n"
         << "  count3: " << byLoops << " triples, " << loopChecks << " checks\n"
         << "  countK: " << byRec   << " triples, " << checks << " checks, "
         << calls << " calls\n\n";

    cout << "k = 3, seed 343, values in [-100, 100]:\n";
    cout << "     n   triples   loop checks   rec checks   rec calls    C(n,3)\n";
    for (int n : {10, 20, 40, 80, 160}) {
        vector<int> a = testData(n, 343);
        checks = 0;
        long t3 = count3(a);
        long lc = checks;
        checks = calls = 0;
        long tk = countK(a, 0, 3, 0);
        cout << setw(6) << n << setw(10) << t3 << setw(14) << lc << setw(13) << checks
             << setw(12) << calls << setw(10) << choose(n, 3) << "\n";
        if (t3 != tk || lc != checks || lc != choose(n, 3)) { cout << "MISMATCH\n"; return 1; }
    }

    cout << "\nn = 20, k varies:\n";
    cout << "     k     found      checks       calls     C(20,k)\n";
    vector<int> a20 = testData(20, 343);
    for (int k = 1; k <= 6; k++) {
        checks = calls = 0;
        long found = countK(a20, 0, k, 0);
        long sumC = 0;
        for (int j = 0; j <= k; j++) sumC += choose(20, j);
        cout << setw(6) << k << setw(10) << found << setw(12) << checks << setw(12) << calls
             << setw(12) << choose(20, k) << "\n";
        if (checks != choose(20, k) || calls != sumC) { cout << "MISMATCH\n"; return 1; }
    }

    cout << "\nn = 40, k varies (timed):\n";
    cout << "     k        checks     seconds\n";
    vector<int> a40 = testData(40, 343);
    for (int k : {4, 6, 8, 10}) {
        checks = calls = 0;
        auto t0 = chrono::steady_clock::now();
        countK(a40, 0, k, 0);
        double s = chrono::duration<double>(chrono::steady_clock::now() - t0).count();
        cout << setw(6) << k << setw(14) << checks << setw(12) << fixed << setprecision(3)
             << s << "\n";
        if (checks != choose(40, k)) { cout << "MISMATCH\n"; return 1; }
    }
    cout << "\nC(40,20) = " << choose(40, 20) << " checks for k = 20\n";
    return 0;
}
