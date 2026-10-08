// CSS 343 - code library: rng.h
// A small random number generator that gives the SAME sequence on every
// compiler and standard library. (std::mt19937 does too, but the
// std::uniform_int_distribution and std::shuffle built on it do not: g++ and
// clang can turn the same seed into different numbers.) Use it whenever test
// data must be reproducible across machines.
//
//   #include "rng.h"
//   Rng r(343);                    // any seed except 0
//   int x = r.between(-1000, 1000); // inclusive
//   r.shuffle(v);                   // Fisher-Yates, same order everywhere
#pragma once
#include <cstdint>
#include <vector>
#include <utility>

class Rng {
public:
    explicit Rng(uint64_t seed = 88172645463325252ull) : s(seed ? seed : 1) {}

    /** the next 64 random bits (xorshift64) */
    uint64_t next() { s ^= s << 13; s ^= s >> 7; s ^= s << 17; return s; }

    /** a uniform integer in [lo, hi], inclusive. Uses the remainder, so values
     *  are very slightly uneven for huge ranges; fine for test data. */
    long long between(long long lo, long long hi) {
        uint64_t span = (uint64_t)(hi - lo) + 1;
        return lo + (long long)(next() % span);
    }

    /** a uniform double in [0, 1) */
    double unit() { return (next() >> 11) * (1.0 / 9007199254740992.0); }

    /** shuffle in place: every order equally likely */
    template <class T> void shuffle(std::vector<T>& v) {
        for (size_t i = v.size(); i > 1; i--) std::swap(v[i - 1], v[next() % i]);
    }

private:
    uint64_t s;
};
