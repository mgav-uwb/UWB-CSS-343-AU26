// CSS 343 - program: how long does one memory read take?
//
// Pointer chasing: an array of indices forms ONE random cycle through every
// slot, and the loop follows it (i = next[i]). Each read depends on the one
// before, so the processor cannot overlap them or predict the next address:
// the time per step is the latency of wherever the array lives. As the array
// grows past each cache, the time per read jumps to the next level.
//
// Build & run:  g++ -std=c++17 -O2 latency.cpp -o latency && ./latency
// (about a minute and a half; the largest array is 512 MiB)

#include <cstdio>
#include <cstdint>
#include <vector>
#include <chrono>
using namespace std;

static uint64_t rng = 88172645463325252ull;           // xorshift64: same on every compiler
static uint64_t nextRand() { rng ^= rng << 13; rng ^= rng >> 7; rng ^= rng << 17; return rng; }

int main() {
    printf("%12s %14s\n", "array size", "ns per read");
    for (size_t bytes = 4096; bytes <= (size_t)512 << 20; bytes *= 2) {
        size_t n = bytes / sizeof(uint32_t);
        vector<uint32_t> next(n);
        for (size_t i = 0; i < n; i++) next[i] = (uint32_t)i;
        // Sattolo's shuffle: the result is a single cycle through all n slots
        for (size_t i = n - 1; i > 0; i--) {
            size_t j = nextRand() % i;
            uint32_t t = next[i]; next[i] = next[j]; next[j] = t;
        }
        size_t steps = 50000000;                       // enough to swamp timer noise
        uint32_t p = 0;
        for (size_t s = 0; s < n; s++) p = next[p];    // warm up: touch every slot once
        auto t0 = chrono::steady_clock::now();
        for (size_t s = 0; s < steps; s++) p = next[p];
        auto t1 = chrono::steady_clock::now();
        double ns = chrono::duration<double, nano>(t1 - t0).count() / steps;
        char label[32];
        if (bytes < (1 << 20)) snprintf(label, sizeof label, "%zu KiB", bytes >> 10);
        else snprintf(label, sizeof label, "%zu MiB", bytes >> 20);
        printf("%12s %14.2f   (p=%u)\n", label, ns, p);  // printing p keeps the loop alive
    }
}
