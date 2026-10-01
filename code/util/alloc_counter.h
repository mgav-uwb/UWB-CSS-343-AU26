// CSS 343 · code library: alloc_counter.h
// Count every byte a program allocates with new, by replacing the global
// operator new and operator delete. Include it in EXACTLY ONE .cpp file of a
// program (it defines functions, so a second inclusion is a linker error).
//
//   #include "alloc_counter.h"
//   AllocStats before = allocStats();
//   std::vector<int> v(1000);
//   AllocStats d = allocStats() - before;   // d.bytes == 4000, d.blocks == 1
//
// It counts what the program REQUESTS. The allocator adds its own bookkeeping
// per block, which these numbers do not include.
#pragma once
#include <cstdlib>
#include <new>

struct AllocStats {
    long long bytes = 0;    // bytes requested by new, in total
    long long blocks = 0;   // calls to new
    long long frees = 0;    // calls to delete
    AllocStats operator-(const AllocStats& o) const { return { bytes - o.bytes, blocks - o.blocks, frees - o.frees }; }
    long long live() const { return blocks - frees; }   // blocks not yet freed
};

inline AllocStats& allocStatsRef() { static AllocStats s; return s; }
inline AllocStats allocStats() { return allocStatsRef(); }

static void* countedNew(std::size_t n) {
    AllocStats& s = allocStatsRef(); s.bytes += (long long)n; s.blocks++;
    if (void* p = std::malloc(n ? n : 1)) return p;
    throw std::bad_alloc();
}
static void countedDelete(void* p) { if (p) { allocStatsRef().frees++; std::free(p); } }

void* operator new(std::size_t n) { return countedNew(n); }
void* operator new[](std::size_t n) { return countedNew(n); }
void operator delete(void* p) noexcept { countedDelete(p); }
void operator delete[](void* p) noexcept { countedDelete(p); }
void operator delete(void* p, std::size_t) noexcept { countedDelete(p); }
void operator delete[](void* p, std::size_t) noexcept { countedDelete(p); }
