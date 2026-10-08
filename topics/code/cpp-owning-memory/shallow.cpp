// CSS 343 - topic program: what goes wrong WITHOUT the Rule of Three.
// The class has a destructor but no copy constructor, so the compiler's
// default copy duplicates the head POINTER: two lists share one chain.
//
//   build:  g++ -std=c++17 -g shallow.cpp -o shallow
//   run:    ./shallow            (aliasing only: safe)
//           ./shallow crash      (lets both destructors run: double delete)
#include <iostream>
#include <cstring>
using namespace std;

struct Node {
    int   key;
    Node* next;
};

class ShallowList {
public:
    ShallowList() = default;
    ~ShallowList() {
        if (!owner) return;
        while (head != nullptr) {
            Node* doomed = head;
            head = head->next;
            delete doomed;
        }
    }
    void pushFront(int key) { head = new Node{key, head}; }
    void setFirst(int key) { if (head) head->key = key; }
    void print() const {
        for (const Node* p = head; p != nullptr; p = p->next)
            cout << p->key << (p->next ? " -> " : "");
        cout << "\n";
    }
    bool owner = true;               // demo switch: lets the safe run skip the double delete
private:
    Node* head = nullptr;
};

int main(int argc, char** argv) {
    bool crash = argc > 1 && strcmp(argv[1], "crash") == 0;

    ShallowList a;
    a.pushFront(8);
    a.pushFront(5);
    a.pushFront(3);

    ShallowList b = a;               // default copy: b.head == a.head
    b.setFirst(99);

    cout << "a: "; a.print();
    cout << "b: "; b.print();

    if (!crash) b.owner = false;     // safe run: only a frees the chain
    cout << (crash ? "both destructors run next\n" : "only a frees the nodes\n");
    return 0;
}
