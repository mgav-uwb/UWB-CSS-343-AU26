// CSS 343 · program: three ways to multiply two n x n matrices, the same
// n^3 multiply-adds each, in different memory orders.
//   i-j-k  the textbook loop: B is read down a column, one cache line per read
//   i-k-j  the two inner loops swapped: every inner read is sequential
//   blocked  i-k-j on T x T tiles, so the tiles being combined stay in cache
// All three compute the same product (checked); only the order of memory accesses differs.
//
// Build & run:  g++ -std=c++17 -O2 matmul.cpp -o matmul && ./matmul

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <vector>
using namespace std;

static uint64_t rng = 88172645463325252ull;
static uint64_t nextRand() { rng ^= rng << 13; rng ^= rng >> 7; rng ^= rng << 17; return rng; }

template <class F> static double seconds(F f) {
    auto t0 = chrono::steady_clock::now(); f();
    return chrono::duration<double>(chrono::steady_clock::now() - t0).count();
}

int main() {
    const int n = 2048, T = 64;                     // three 2048 x 2048 matrices of double: 96 MiB
    vector<double> A(n * n), B(n * n), C(n * n);
    for (auto& x : A) x = (double)(nextRand() % 100);
    for (auto& x : B) x = (double)(nextRand() % 100);
    auto check = [&] { double s = 0; for (double x : C) s += x; return s; };

    fill(C.begin(), C.end(), 0.0);
    double tIJK = seconds([&] {
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++) {
                double s = 0;
                for (int k = 0; k < n; k++) s += A[i * n + k] * B[k * n + j];
                C[i * n + j] = s;
            }
    });
    double c1 = check();

    fill(C.begin(), C.end(), 0.0);
    double tIKJ = seconds([&] {
        for (int i = 0; i < n; i++)
            for (int k = 0; k < n; k++) {
                double a = A[i * n + k];
                for (int j = 0; j < n; j++) C[i * n + j] += a * B[k * n + j];
            }
    });
    double c2 = check();

    fill(C.begin(), C.end(), 0.0);
    double tBlk = seconds([&] {
        for (int ii = 0; ii < n; ii += T)
            for (int kk = 0; kk < n; kk += T)
                for (int jj = 0; jj < n; jj += T)
                    for (int i = ii; i < ii + T; i++)
                        for (int k = kk; k < kk + T; k++) {
                            double a = A[i * n + k];
                            for (int j = jj; j < jj + T; j++) C[i * n + j] += a * B[k * n + j];
                        }
    });
    double c3 = check();

    double mads = (double)n * n * n;
    printf("n = %d, %.0f multiply-adds each, products %s\n", n, mads, (c1 == c2 && c2 == c3) ? "agree" : "DIFFER");
    printf("i-j-k    %7.2f s  %6.2f ns per multiply-add\n", tIJK, tIJK * 1e9 / mads);
    printf("i-k-j    %7.2f s  %6.2f ns per multiply-add\n", tIKJ, tIKJ * 1e9 / mads);
    printf("blocked  %7.2f s  %6.2f ns per multiply-add  (T = %d)\n", tBlk, tBlk * 1e9 / mads, T);
    printf("i-j-k / i-k-j = %.1fx   i-j-k / blocked = %.1fx\n", tIJK / tIKJ, tIJK / tBlk);
}
