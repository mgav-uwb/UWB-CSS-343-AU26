// CSS 343 · topic program: what a vector costs, and why layout changes speed.
//   g++ -std=c++17 -O2 vector_locality.cpp -o vector_locality && ./vector_locality
//   g++ -std=c++17 -O0 vector_locality.cpp -o vl0 && ./vl0     (stack bytes per frame)
// Shows: sizeof(vector<int>) (the header), capacity doubling and the total
// number of element copies it causes, a vector of vectors against one flat
// array, the stack bytes one recursive call uses, and the time to sum N ints
// held in an array, in a list allocated in order, and in a list whose nodes
// are scattered through memory.

#include <algorithm>
#include <chrono>
#include <cstdio>
#include <list>
#include <random>
#include <vector>
using namespace std;

struct Particle { double x, y; char alive; int id; };
struct TreeNode { int key; TreeNode* left; TreeNode* right; };

static char* stackBase;
// returns how far below stackBase the deepest frame's local sits
int depthTo(int n) {
    volatile char probe;
    if (n == 0) return (int)(stackBase - (char*)&probe);
    return depthTo(n - 1) + 0;   // "+ 0" keeps it from becoming a loop
}

int main() {
    printf("sizeof(vector<int>) = %zu bytes (pointer to data, size, capacity)\n", sizeof(vector<int>));
    printf("sizeof(TreeNode) = %zu, sizeof(Particle) = %zu\n", sizeof(TreeNode), sizeof(Particle));

    // capacity doubling: list each new capacity and count the copies a regrow makes
    vector<int> v; size_t last = 0; long copies = 0;
    printf("capacities while pushing 1000 ints:");
    for (int i = 0; i < 1000; i++) {
        if (v.size() == v.capacity()) copies += (long)v.size();   // a regrow copies every element
        v.push_back(i);
        if (v.capacity() != last) { printf(" %zu", v.capacity()); last = v.capacity(); }
    }
    printf("\nN = 1000: capacity %zu, element copies during regrowth %ld\n", v.capacity(), copies);

    // a 1000 x 1000 table two ways (bytes requested from the heap, plus headers)
    const long n = 1000;
    long nested = (long)sizeof(vector<vector<int>>) + n * (long)sizeof(vector<int>) + n * n * (long)sizeof(int);
    long flat = (long)sizeof(vector<int>) + n * n * (long)sizeof(int);
    printf("1000 x 1000 ints: vector<vector<int>> %ld bytes in %ld heap blocks, flat vector<int> %ld bytes in 1 block\n",
           nested, n + 1, flat);

    // stack bytes per recursive call (meaningful at -O0; -O2 may inline the recursion)
    volatile char top; stackBase = (char*)&top;
    int d100 = depthTo(100), d0 = depthTo(0);
    printf("stack bytes per depthTo frame: %.1f\n", (d100 - d0) / 100.0);

    // locality: sum N ints three ways, best of 5 runs
    const int N = 4000000;
    vector<int> a(N, 1);
    list<int> inOrder(N, 1);
    list<int> pool(N, 1), scattered;
    vector<list<int>::iterator> its;
    for (auto it = pool.begin(); it != pool.end(); ++it) its.push_back(it);
    mt19937 rng(1); shuffle(its.begin(), its.end(), rng);
    for (auto it : its) scattered.splice(scattered.end(), pool, it);   // same nodes, random order

    auto perElement = [&](auto sum) {
        double best = 1e18;
        for (int r = 0; r < 5; r++) {
            auto t0 = chrono::steady_clock::now(); long s = sum(); auto t1 = chrono::steady_clock::now();
            if (s != N) printf("wrong sum\n");
            best = min(best, chrono::duration<double, nano>(t1 - t0).count() / N);
        }
        return best;
    };
    double tA = perElement([&] { long s = 0; for (int x : a) s += x; return s; });
    double tL = perElement([&] { long s = 0; for (int x : inOrder) s += x; return s; });
    double tS = perElement([&] { long s = 0; for (int x : scattered) s += x; return s; });
    printf("ns per element, N = %d: array %.2f, list in allocation order %.2f, list scattered %.2f\n", N, tA, tL, tS);
}
