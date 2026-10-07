/**
 * CareerOS Phase 2 — Verified Learning Resources Catalog
 * Strict evidence integrity: All links, providers, and topics are verified.
 * Never fabricates synthetic URLs or fake courses.
 */

import { VerifiedResource } from '../../types/learning.ts';

export const VERIFIED_RESOURCE_CATALOG: VerifiedResource[] = [
  // --- PYTHON & PROGRAMMING ---
  {
    id: 'res-py-1',
    title: 'Python Official Tutorial: Control Flow & Data Structures',
    provider: 'Python Software Foundation',
    url: 'https://docs.python.org/3/tutorial/controlflow.html',
    type: 'official_doc',
    role: 'primary',
    topic: 'Python Fundamentals',
    difficulty: 'beginner',
    is_free: true,
    why_recommended: 'Authoritative language specification covering functions, argument passing, and loops with zero ambiguity.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
  {
    id: 'res-py-2',
    title: 'Python Practice Problems: Functions & Logic',
    provider: 'Exercism',
    url: 'https://exercism.org/tracks/python',
    type: 'practice_platform',
    role: 'practice',
    topic: 'Python Functions',
    difficulty: 'beginner',
    is_free: true,
    why_recommended: 'Hands-on automated unit tests reinforcing idiomatic parameter handling and return values.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
  {
    id: 'res-py-3',
    title: 'Modern Python 3 Object-Oriented Programming Guide',
    provider: 'Real Python',
    url: 'https://realpython.com/python3-object-oriented-programming/',
    type: 'tutorial',
    role: 'alternative',
    topic: 'Object-Oriented Programming',
    difficulty: 'intermediate',
    is_free: true,
    why_recommended: 'Clear real-world analogies explaining classes, inheritance, and encapsulation for application architecture.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },

  // --- GIT & VERSION CONTROL ---
  {
    id: 'res-git-1',
    title: 'Pro Git Book: Git Basics & Branching Workflows',
    provider: 'Git SCM Official Documentation',
    url: 'https://git-scm.com/book/en/v2',
    type: 'book',
    role: 'primary',
    topic: 'Git Fundamentals',
    difficulty: 'beginner',
    is_free: true,
    why_recommended: 'Official comprehensive reference for distributed version control, staging, commits, and branch merging.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
  {
    id: 'res-git-2',
    title: 'Learn Git Branching Interactive Sandbox',
    provider: 'LearnGitBranching',
    url: 'https://learngitbranching.js.org/',
    type: 'practice_platform',
    role: 'practice',
    topic: 'Git Branching',
    difficulty: 'beginner',
    is_free: true,
    why_recommended: 'Visual interactive sandbox to master merges, rebases, cherry-picks, and remote branch tracking.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },

  // --- MATHEMATICS & STATISTICS ---
  {
    id: 'res-math-1',
    title: 'Linear Algebra for Machine Learning: Vectors & Matrices',
    provider: 'Khan Academy',
    url: 'https://www.khanacademy.org/math/linear-algebra',
    type: 'course',
    role: 'primary',
    topic: 'Linear Algebra',
    difficulty: 'beginner',
    is_free: true,
    why_recommended: 'Intuitive geometric visualizations of vector spaces, matrix multiplication, dot products, and transformations.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
  {
    id: 'res-math-2',
    title: 'Probability and Statistics Foundations',
    provider: 'MIT OpenCourseWare',
    url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2014/',
    type: 'course',
    role: 'primary',
    topic: 'Probability & Statistics',
    difficulty: 'intermediate',
    is_free: true,
    why_recommended: 'Rigorous open-access curriculum establishing conditional probability, Bayes theorem, variance, and distributions.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },

  // --- DATA HANDLING (NUMPY & PANDAS) ---
  {
    id: 'res-data-1',
    title: 'NumPy Quickstart Tutorial & Vectorized Operations',
    provider: 'NumPy Official Documentation',
    url: 'https://numpy.org/doc/stable/user/quickstart.html',
    type: 'official_doc',
    role: 'primary',
    topic: 'NumPy Arrays',
    difficulty: 'beginner',
    is_free: true,
    why_recommended: 'Essential guide to multi-dimensional ndarray manipulations, broadcasting rules, and numerical indexing.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
  {
    id: 'res-data-2',
    title: '10 Minutes to pandas: DataFrames and Series',
    provider: 'pandas Community Development Team',
    url: 'https://pandas.pydata.org/docs/user_guide/10min.html',
    type: 'official_doc',
    role: 'primary',
    topic: 'Pandas DataFrames',
    difficulty: 'beginner',
    is_free: true,
    why_recommended: 'Canonical rapid walkthrough of tabular data loading, filtering, grouping, aggregation, and null handling.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
  {
    id: 'res-data-3',
    title: 'Pandas Data Cleaning Real Exercises',
    provider: 'Kaggle Learn',
    url: 'https://www.kaggle.com/learn/pandas',
    type: 'practice_platform',
    role: 'practice',
    topic: 'Data Preprocessing',
    difficulty: 'intermediate',
    is_free: true,
    why_recommended: 'Interactive browser notebooks analyzing real tabular datasets with instant automated validation checks.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },

  // --- MACHINE LEARNING ---
  {
    id: 'res-ml-1',
    title: 'Scikit-Learn Machine Learning in Python Guide',
    provider: 'scikit-learn Developers',
    url: 'https://scikit-learn.org/stable/tutorial/basic/tutorial.html',
    type: 'official_doc',
    role: 'primary',
    topic: 'Supervised Learning',
    difficulty: 'intermediate',
    is_free: true,
    why_recommended: 'Industry standard library implementation of regression, decision trees, classification, and cross-validation pipelines.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
  {
    id: 'res-ml-2',
    title: 'Machine Learning Crash Course: Loss & Gradient Descent',
    provider: 'Google Developers',
    url: 'https://developers.google.com/machine-learning/crash-course',
    type: 'course',
    role: 'primary',
    topic: 'Model Optimization',
    difficulty: 'beginner',
    is_free: true,
    why_recommended: 'Interactive visualizations demystifying loss reduction, learning rates, feature scaling, and regularization.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },

  // --- DEEP LEARNING ---
  {
    id: 'res-dl-1',
    title: 'Deep Learning with PyTorch: A 60 Minute Blitz',
    provider: 'PyTorch Official Documentation',
    url: 'https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html',
    type: 'official_doc',
    role: 'primary',
    topic: 'Neural Networks & Tensors',
    difficulty: 'intermediate',
    is_free: true,
    why_recommended: 'Direct walkthrough of dynamic autograd tensors, neural network layers, loss functions, and weights optimization.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
  {
    id: 'res-dl-2',
    title: 'Illustrated Transformer Architecture Explained',
    provider: 'Jay Alammar Technical Publications',
    url: 'https://jalammar.github.io/illustrated-transformer/',
    type: 'article',
    role: 'primary',
    topic: 'Transformer Architecture',
    difficulty: 'intermediate',
    is_free: true,
    why_recommended: 'Acclaimed step-by-step visual dissection of self-attention mechanisms, query-key-value vectors, and multi-head attention.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },

  // --- GENERATIVE AI & LLMs ---
  {
    id: 'res-genai-1',
    title: 'Hugging Face NLP Course: Transformers & Tokenizers',
    provider: 'Hugging Face',
    url: 'https://huggingface.co/learn/nlp-course',
    type: 'course',
    role: 'primary',
    topic: 'LLM Fundamentals & Tokenization',
    difficulty: 'intermediate',
    is_free: true,
    why_recommended: 'Practical engineering walkthrough using open models, sentence tokenizers, embeddings, and fine-tuning pipelines.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
  {
    id: 'res-genai-2',
    title: 'Prompt Engineering Guide for Developers',
    provider: 'DAIR.AI',
    url: 'https://www.promptingguide.ai/',
    type: 'official_doc',
    role: 'primary',
    topic: 'Prompt Engineering & RAG',
    difficulty: 'intermediate',
    is_free: true,
    why_recommended: 'Comprehensive patterns covering chain-of-thought, retrieval-augmented generation (RAG), vector embeddings, and evaluation.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },

  // --- WEB FRONTEND (HTML/CSS/JS/REACT) ---
  {
    id: 'res-fe-1',
    title: 'MDN Web Docs: JavaScript Fundamentals & DOM API',
    provider: 'Mozilla Developer Network',
    url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript',
    type: 'official_doc',
    role: 'primary',
    topic: 'JavaScript Fundamentals',
    difficulty: 'beginner',
    is_free: true,
    why_recommended: 'The definitive web standards documentation covering modern syntax, event listeners, async/await, and fetch APIs.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
  {
    id: 'res-fe-2',
    title: 'React Official Documentation: Describing the UI & Managing State',
    provider: 'React Core Team / Meta',
    url: 'https://react.dev/learn',
    type: 'official_doc',
    role: 'primary',
    topic: 'React & Hooks',
    difficulty: 'intermediate',
    is_free: true,
    why_recommended: 'Official modern guide emphasizing pure components, declarative state triggers, and useEffect dependency hygiene.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
  {
    id: 'res-fe-3',
    title: 'TypeScript Official Handbook for JavaScript Developers',
    provider: 'Microsoft TypeScript Team',
    url: 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html',
    type: 'official_doc',
    role: 'primary',
    topic: 'TypeScript',
    difficulty: 'intermediate',
    is_free: true,
    why_recommended: 'Direct guide to type annotations, interfaces, generics, and strict compile-time bug prevention.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },

  // --- BACKEND & APIS & CLOUD ---
  {
    id: 'res-be-1',
    title: 'Express.js Guide: Routing, Middleware, and REST APIs',
    provider: 'OpenJS Foundation',
    url: 'https://expressjs.com/en/starter/basic-routing.html',
    type: 'official_doc',
    role: 'primary',
    topic: 'REST APIs & Middleware',
    difficulty: 'beginner',
    is_free: true,
    why_recommended: 'Official architecture reference for JSON endpoints, middleware chains, route parameters, and error handlers.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
  {
    id: 'res-be-2',
    title: 'PostgreSQL Official Tutorial: SQL Queries & Joins',
    provider: 'PostgreSQL Global Development Group',
    url: 'https://www.postgresql.org/docs/current/tutorial.html',
    type: 'official_doc',
    role: 'primary',
    topic: 'SQL & Relational Databases',
    difficulty: 'beginner',
    is_free: true,
    why_recommended: 'Authoritative guide to relational tables, foreign keys, inner/outer joins, and index optimization.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
  {
    id: 'res-be-3',
    title: 'Docker Get Started: Containerization & Dockerfiles',
    provider: 'Docker Official Documentation',
    url: 'https://docs.docker.com/get-started/',
    type: 'official_doc',
    role: 'primary',
    topic: 'Docker & Containers',
    difficulty: 'intermediate',
    is_free: true,
    why_recommended: 'Definitive guide to packaging applications, reproducible container images, and local multi-container orchestration.',
    verification_status: 'VERIFIED',
    retrieved_date: '2026-10-05',
  },
];

export function findResourcesForTopic(topic: string, preferredType?: string): VerifiedResource[] {
  const normalized = topic.toLowerCase();
  const matched = VERIFIED_RESOURCE_CATALOG.filter((res) => {
    return (
      res.topic.toLowerCase().includes(normalized) ||
      normalized.includes(res.topic.toLowerCase()) ||
      res.title.toLowerCase().includes(normalized)
    );
  });

  if (matched.length > 0) {
    if (preferredType) {
      const preferred = matched.filter((r) => r.type === preferredType);
      if (preferred.length > 0) return preferred;
    }
    return matched;
  }

  // Graceful fallback to foundational documentation
  return [VERIFIED_RESOURCE_CATALOG[0]];
}
