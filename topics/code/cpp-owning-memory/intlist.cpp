// CSS 343 - topic program: a class that owns heap memory, and the Rule of
// Three (destructor, copy constructor, copy assignment).
//
//   build:       g++ -std=c++17 -g intlist.cpp -o intlist
//   run:         ./intlist
//   leak-check:  valgrind --leak-check=full ./intlist      (CSS Linux lab)
#include <iostream>
using namespace std;

long liveNodes = 0;                  // nodes allocated and not yet freed

struct Node {
    int   key;
    Node* next;
    Node(int k, Node* n) : key(k), next(n) { liveNodes++; }
    ~Node() { liveNodes--; }
};

class IntList {
public:
    IntList() = default;

    ~IntList() { clear(); }                          // 1. destructor

    IntList(const IntList& other) { copyFrom(other); }   // 2. copy constructor

    IntList& operator=(const IntList& other) {       // 3. copy assignment
        if (this != &other) {                        //    self-assignment guard
            clear();                                 //    free what we own
            copyFrom(other);                         //    then deep-copy
        }
        return *this;
    }

    void pushFront(int key) { head = new Node(key, head); }

    void setFirst(int key) { if (head) head->key = key; }

    int size() const {
        int n = 0;
        for (const Node* p = head; p != nullptr; p = p->next) n++;
        return n;
    }

    void print() const {
        for (const Node* p = head; p != nullptr; p = p->next)
            cout << p->key << (p->next ? " -> " : "");
        cout << "\n";
    }

private:
    Node* head = nullptr;

    void clear() {
        while (head != nullptr) {
            Node* doomed = head;
            head = head->next;
            delete doomed;
        }
    }

    void copyFrom(const IntList& other) {            // deep copy, order preserved
        Node* tail = nullptr;
        for (const Node* p = other.head; p != nullptr; p = p->next) {
            Node* n = new Node(p->key, nullptr);
            if (tail == nullptr) head = n;           // first node
            else                 tail->next = n;     // append after the last
            tail = n;
        }
    }
};

int main() {
    {
        IntList a;
        a.pushFront(8);
        a.pushFront(5);
        a.pushFront(3);
        cout << "a: "; a.print();

        IntList b = a;               // copy constructor: b gets its OWN nodes
        b.setFirst(99);
        cout << "after b = a; b.setFirst(99)\n";
        cout << "a: "; a.print();
        cout << "b: "; b.print();

        IntList c;
        c.pushFront(1);
        c = a;                       // copy assignment: frees c's node first
        c = c;                       // self-assignment: must be harmless
        cout << "c: "; c.print();
        cout << "live nodes inside the block: " << liveNodes << "\n";
    }                                // a, b, c destroyed here
    cout << "live nodes after the block:  " << liveNodes << "\n";
    return 0;
}
