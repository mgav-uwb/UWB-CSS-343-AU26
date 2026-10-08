// CSS 343 - code library: example.cpp, the three utilities together.
//   g++ -std=c++17 -O2 example.cpp -o example && ./example
#include <cstdio>
#include <vector>
#include <list>
#include <algorithm>
#include "rng.h"
#include "timer.h"
#include "alloc_counter.h"   // in exactly one .cpp file

int main() {
    Rng r(343);
    std::vector<int> v(1000000);
    for (int& x : v) x = (int)r.between(-1000000, 1000000);
    printf("first three values: %d %d %d (the same on every compiler)\n", v[0], v[1], v[2]);

    std::vector<int> w;
    double t = fastestOf(5, [&] { w = v; std::sort(w.begin(), w.end()); });
    printf("sorting 1,000,000 ints: %.3f s (fastest of 5); smallest %d\n", t, w[0]);

    AllocStats before = allocStats();
    {
        std::vector<int> a(1000);
        std::list<int> l(1000);
        AllocStats d = allocStats() - before;
        printf("vector<int>(1000) + list<int>(1000): %lld bytes in %lld blocks\n", d.bytes, d.blocks);
    }
    printf("blocks still allocated from that block: %lld\n", (allocStats() - before).live());
}
