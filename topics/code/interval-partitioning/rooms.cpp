// CSS 343 - topic program: interval partitioning, start order, reuse a free room.
// Prints the rooms the greedy opens and the depth (the most requests live at
// one instant) for the slides' five requests and the ten-request practice.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 rooms.cpp -o rooms
//   run:    ./rooms
#include <algorithm>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

struct Request { string name; int start, finish; };     // [start, finish)

struct Greater {                         // reverses the comparison
    bool operator()(int a, int b) const { return a > b; }
};

bool startsFirst(const Request& a, const Request& b) {
    return a.start < b.start;
}

int minRooms(vector<Request> reqs) {
    sort(reqs.begin(), reqs.end(), startsFirst);
    // the times the open rooms come free, soonest on top
    priority_queue<int, vector<int>, Greater> freeAt;
    for (const Request& r : reqs) {
        if (!freeAt.empty() && freeAt.top() <= r.start)
            freeAt.pop();                    // reuse the soonest-free room
        freeAt.push(r.finish);               // r holds a room until r.finish
    }
    return freeAt.size();                    // one entry per room ever opened
}

// The depth: the most requests live in any unit [t, t + 1).
int depth(const vector<Request>& reqs) {
    int lo = reqs[0].start, hi = reqs[0].finish, best = 0;
    for (const Request& r : reqs) { lo = min(lo, r.start); hi = max(hi, r.finish); }
    for (int t = lo; t < hi; t++) {
        int live = 0;
        for (const Request& r : reqs) if (r.start <= t && t < r.finish) live++;
        best = max(best, live);
    }
    return best;
}

int main() {
    vector<Request> five = {{"a", 1, 5}, {"b", 2, 6}, {"c", 3, 7}, {"d", 7, 9}, {"e", 8, 11}};
    vector<Request> ten = {{"a", 1, 4}, {"b", 3, 5}, {"c", 0, 6}, {"d", 4, 7}, {"e", 7, 9},
                           {"f", 5, 9}, {"g", 6, 10}, {"h", 8, 11}, {"i", 8, 12}, {"j", 11, 13}};
    cout << "five: rooms " << minRooms(five) << ", depth " << depth(five) << "\n";
    cout << "ten: rooms " << minRooms(ten) << ", depth " << depth(ten) << "\n";
    return 0;
}
