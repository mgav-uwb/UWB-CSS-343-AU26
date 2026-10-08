// CSS 343 - topic program: counting bytes in C++.
//   g++ -std=c++17 -O2 sizeof_demo.cpp -o sizeof_demo && ./sizeof_demo
// Shows: primitive sizes, struct PADDING (alignment), and the memory an
// array of N ints vs a linked list of N ints ACTUALLY costs.
//
// We don't *compute* the memory from a formula; we MEASURE it: a global
// operator-new counter records every heap byte the program requests, so the
// array buffer and the N real nodes report their true footprint.

#include <cstdio>
#include <cstdlib>
#include <cstddef>
#include <vector>
using namespace std;

// ---- heap-byte meter: count every allocation the program makes ----
static long long g_heap = 0;
void* operator new(size_t s)        { g_heap += (long long)s; return malloc(s); }
void* operator new[](size_t s)      { g_heap += (long long)s; return malloc(s); }
void  operator delete(void* p) noexcept            { free(p); }
void  operator delete[](void* p) noexcept          { free(p); }
void  operator delete(void* p, size_t) noexcept    { free(p); }
void  operator delete[](void* p, size_t) noexcept  { free(p); }

struct Node {            // one linked-list node holding an int
    int   data;          // 4 bytes
    Node* next;          // 8 bytes (64-bit pointer)
};                       // sizeof? not 12: alignment rounds up to 16

struct Packed {          // same fields, reordered + packed
    Node* next;          // 8
    int   data;          // 4  (+4 padding at the end)
};

int main() {
    printf("PRIMITIVES (bytes)\n");
    printf("  char   %zu      bool   %zu\n", sizeof(char), sizeof(bool));
    printf("  int    %zu      long   %zu\n", sizeof(int),  sizeof(long));
    printf("  double %zu      ptr    %zu\n", sizeof(double), sizeof(void*));

    printf("\nSTRUCTS (alignment / padding)\n");
    printf("  int(4) + ptr(8) = 12 logically, but sizeof(Node)   = %zu\n", sizeof(Node));
    printf("  sizeof(Packed) = %zu   (still padded to a multiple of 8)\n", sizeof(Packed));

    printf("\nMEMORY ACTUALLY ALLOCATED FOR N ELEMENTS (measured via operator new)\n");
    printf("%8s %16s %16s %8s   %s\n",
           "N", "array heap B", "list heap B", "ratio", "B / element");
    for (long N = 1000; N <= 16000; N += N) {
        // --- ARRAY: one contiguous buffer of N ints ---
        long long h0 = g_heap;
        vector<int> a(N);                 // really allocates the buffer on the heap
        for (long i = 0; i < N; i++) a[i] = (int)i;
        long long arrayBytes = g_heap - h0;

        // --- LINKED LIST: N real heap nodes ---
        long long h1 = g_heap;
        Node* head = nullptr;
        for (long i = 0; i < N; i++) head = new Node{(int)i, head};   // N separate news
        long long listBytes = g_heap - h1;

        printf("%8ld %16lld %16lld %7.1fx   %lld vs %lld\n",
               N, arrayBytes, listBytes, (double)listBytes / arrayBytes,
               arrayBytes / N, listBytes / N);

        while (head) { Node* nx = head->next; delete head; head = nx; }  // free the list
    }                                                                    // a freed at scope end

    printf("\nMeasured, not assumed: array = sizeof(int) per element, list = sizeof(Node)\n"
           "per node. Same order of growth (O(N)); the list's constant is %.0fx; that's\n"
           "the 4 bytes of data + 4 padding + 8 pointer from the struct above.\n",
           (double)sizeof(Node) / sizeof(int));
    return 0;
}
