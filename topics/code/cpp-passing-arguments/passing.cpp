// CSS 343 - topic program: three ways to pass an argument, and what const
// reference buys.
//
//   build:  g++ -std=c++17 -O2 passing.cpp -o passing
//   run:    ./passing
#include <iostream>
#include <vector>
using namespace std;

void byValue(int x)  { x = 99; }     // changes a copy
void byRef(int& x)   { x = 99; }     // changes the caller's variable
void byPtr(int* x)   { *x = 99; }    // changes what the pointer points at

long copies = 0;                     // counts element copies made by Tracked

struct Tracked {                     // an int that counts how often it is copied
    int v = 0;
    Tracked() = default;
    Tracked(int v) : v(v) {}
    Tracked(const Tracked& o) : v(o.v) { copies++; }
    Tracked& operator=(const Tracked& o) { v = o.v; copies++; return *this; }
};

long sumByValue(vector<Tracked> a) {            // copies all N elements
    long s = 0;
    for (const Tracked& t : a) s += t.v;
    return s;
}
long sumByConstRef(const vector<Tracked>& a) {  // copies nothing, cannot modify
    long s = 0;
    for (const Tracked& t : a) s += t.v;
    return s;
}

int main() {
    int a = 1, b = 1, c = 1;
    byValue(a);
    byRef(b);
    byPtr(&c);
    cout << a << " " << b << " " << c << "\n";

    vector<Tracked> big(1000);
    for (int i = 0; i < 1000; i++) big[i].v = i;

    copies = 0;
    long s1 = sumByValue(big);
    cout << "by value:     sum = " << s1 << ", element copies = " << copies << "\n";

    copies = 0;
    long s2 = sumByConstRef(big);
    cout << "by const ref: sum = " << s2 << ", element copies = " << copies << "\n";
    return 0;
}
