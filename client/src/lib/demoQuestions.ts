/**
 * Standalone Demo Question Bank (completely separate from tournament questions on server/Supabase).
 * Used exclusively by Demo Mode so tournament answers are never bundled in the client.
 */

export interface DemoQuestion {
  id: string;
  lv: number;
  q: string;
  options: [string, string, string, string];
  a: number;
  topic: string;
  explanation: string;
}

export const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: 'DEMO-01',
    lv: 1,
    q: 'Which data structure follows LIFO (Last In, First Out) ordering?',
    options: ['Queue', 'Stack', 'Linked List', 'Hash Table'],
    a: 1,
    topic: 'Data Structures',
    explanation: 'A Stack pushes and pops elements from the top (Last In, First Out).',
  },
  {
    id: 'DEMO-02',
    lv: 1,
    q: 'What does HTTP status code 404 indicate?',
    options: ['Unauthorized', 'Internal Server Error', 'Not Found', 'Too Many Requests'],
    a: 2,
    topic: 'Web & Networking',
    explanation: '404 indicates the requested resource could not be found on the server.',
  },
  {
    id: 'DEMO-03',
    lv: 2,
    q: 'What is the worst-case time complexity of Binary Search on a sorted array of size n?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    a: 1,
    topic: 'Algorithms',
    explanation: 'Binary search halves the search interval on each step, taking O(log n) time.',
  },
  {
    id: 'DEMO-04',
    lv: 5,
    q: 'Which layer of the OSI model handles IP routing and packet forwarding?',
    options: ['Data Link Layer', 'Transport Layer', 'Network Layer', 'Session Layer'],
    a: 2,
    topic: 'Networking',
    explanation: 'Layer 3 (Network Layer) handles logical addressing (IP) and routing.',
  },
  {
    id: 'DEMO-05',
    lv: 10,
    q: 'In PostgreSQL, which lock clause prevents concurrent transactions from modifying a selected row until commit?',
    options: ['FOR SHARE', 'FOR UPDATE', 'LOCK CACHE', 'WITH READ ONLY'],
    a: 1,
    topic: 'Databases',
    explanation: 'SELECT ... FOR UPDATE acquires an exclusive row-level lock for the active transaction.',
  },
  {
    id: 'DEMO-06',
    lv: 15,
    q: 'Which Git command creates a new commit that safely undoes the changes of a previous commit without rewriting history?',
    options: ['git reset --hard', 'git rebase', 'git revert', 'git cherry-pick'],
    a: 2,
    topic: 'Git',
    explanation: 'git revert creates a new inverse commit, preserving shared branch history.',
  },
  {
    id: 'DEMO-07',
    lv: 18,
    q: 'What is the primary purpose of a database connection pooler like Supavisor in transaction mode?',
    options: [
      'Encrypt client passwords',
      'Multiplex many short-lived requests across fewer database connections',
      'Compress JSON payloads',
      'Render static HTML pages',
    ],
    a: 1,
    topic: 'Scalability',
    explanation: 'Transaction pooling shares a limited pool of Postgres connections across hundreds of concurrent clients.',
  },
  {
    id: 'DEMO-08',
    lv: 22,
    q: 'Which CSS property triggers GPU compositing without causing layout reflow?',
    options: ['width', 'margin-top', 'transform', 'border-width'],
    a: 2,
    topic: 'Frontend Performance',
    explanation: 'transform and opacity are handled on the compositor thread for smooth 60fps animations.',
  },
  {
    id: 'DEMO-09',
    lv: 30,
    q: 'What problem does a Token Bucket algorithm solve in API servers?',
    options: ['SQL injection', 'Rate limiting bursts while enforcing average throughput', 'Deadlock detection', 'DNS caching'],
    a: 1,
    topic: 'System Design',
    explanation: 'Token buckets allow controlled short bursts up to bucket capacity while limiting sustained request rate.',
  },
  {
    id: 'DEMO-10',
    lv: 40,
    q: 'In React, why does passing an inline function or unstable dependency into useEffect cause infinite loops?',
    options: [
      'React compiles inline functions synchronously',
      'Reference inequality triggers re-execution on every render',
      'TypeScript strips effect cleanup handlers',
      'DOM nodes lose event listeners',
    ],
    a: 1,
    topic: 'React',
    explanation: 'New function/object references fail Object.is checks, re-firing the effect on every render.',
  },
  {
    id: 'DEMO-11',
    lv: 50,
    q: 'In distributed systems, what does the CAP theorem state during a network partition?',
    options: [
      'A system can guarantee both Consistency and Availability simultaneously',
      'A system must trade off between Consistency and Availability',
      'Latency becomes zero across replicas',
      'Database indexes automatically rebuild',
    ],
    a: 1,
    topic: 'Distributed Systems',
    explanation: 'Under a network partition (P), a distributed store must choose between linearizable Consistency (C) and Availability (A).',
  },
  {
    id: 'DEMO-12',
    lv: 59,
    q: 'Which Linux kernel mechanism lets Node.js handle thousands of concurrent WebSockets on a single event loop?',
    options: ['fork() per packet', 'epoll / kqueue I/O multiplexing', 'Busy polling on spinlocks', 'Round-robin thread sleep'],
    a: 1,
    topic: 'Operating Systems',
    explanation: 'libuv leverages epoll (Linux) / kqueue (macOS) / IOCP (Windows) for non-blocking I/O multiplexing.',
  },
  {
    id: 'DEMO-13',
    lv: 60,
    q: 'Final Ascension: In Project Eclipse, what happens when a player fails Room 4 (Void)?',
    options: [
      'They drop 1 level',
      'They pause for 30 seconds',
      'Full progress reset to Level 0 with resets += 1',
      'They automatically advance to Level 60',
    ],
    a: 2,
    topic: 'Eclipse Protocol',
    explanation: 'Failing Room 4 (5 consecutive misses) triggers a full reset back to Level 0.',
  },
];
