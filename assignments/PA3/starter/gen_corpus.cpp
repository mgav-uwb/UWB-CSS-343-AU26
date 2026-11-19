// CSS 343 - PA3 benchmark corpus generator (GIVEN).
//   g++ -std=c++17 -O2 gen_corpus.cpp -o gen && ./gen
// Writes the pairs bench_A_N.txt / bench_B_N.txt for N = 1000, 2000, 4000 and
// 8000 lines (fixed seed): B is A with about 5% of its lines edited, 2%
// deleted and 2% inserted, like the inputs a diff usually sees. Also writes
// big_A_30000.txt / big_B_30000.txt, which only --stat can handle: the full
// table would need 30,001 x 30,001 ints, about 3.6 GB; two rolling rows of
// longs need about 480 KB.
#include <fstream>
#include <string>
#include <vector>
using namespace std;

static unsigned seed = 4343;
static unsigned rnd() { seed = seed * 1103515245u + 12345u; return seed >> 16; }

static string word() {
    static const char* W[] = {"alpha", "bravo", "china", "delta", "echo", "fox",
        "golf", "hotel", "india", "jazz", "kilo", "lima", "mike", "nova", "oscar", "papa"};
    return W[rnd() % 16];
}

static string line() {
    string t;
    int n = 4 + rnd() % 8;
    for (int i = 0; i < n; i++) t += (i ? " " : "") + word();
    return t;
}

static void writePair(const string& tag, int n) {
    vector<string> A;
    for (int i = 0; i < n; i++) A.push_back(line());
    ofstream fa(tag + "_A_" + to_string(n) + ".txt");
    for (const string& l : A) fa << l << '\n';
    ofstream fb(tag + "_B_" + to_string(n) + ".txt");
    for (const string& l : A) {
        unsigned r = rnd() % 100;
        if (r < 2) continue;                               // deleted
        if (r < 4) fb << line() << '\n';                   // a line inserted before it
        if (r >= 4 && r < 9) fb << l << " " << word() << '\n';   // edited
        else fb << l << '\n';
    }
}

int main() {
    for (int n : {1000, 2000, 4000, 8000}) writePair("bench", n);
    writePair("big", 30000);
    return 0;
}
