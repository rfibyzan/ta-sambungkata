import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pisahTertunda } from './rantaiTertunda.js';

const t = (ms) => new Date(ms).toISOString();

test('kata pembuka dan kata pemain tidak pernah ditahan, walau jam database lebih maju', () => {
  const rantai = [
    { kata: 'buku', pemain: 'sistem', created_at: t(10_000) },
    { kata: 'kursi', pemain: 'user', created_at: t(12_000) },
  ];
  assert.deepEqual(pisahTertunda(rantai, 1_000), { tampil: rantai, tertunda: [] });
});

test('kata bot yang waktunya belum tiba ditahan', () => {
  const rantai = [
    { kata: 'buku', pemain: 'sistem', created_at: t(0) },
    { kata: 'kursi', pemain: 'user', created_at: t(100) },
    { kata: 'siang', pemain: 'bot', created_at: t(2_000) },
  ];
  const { tampil, tertunda } = pisahTertunda(rantai, 1_000);
  assert.deepEqual(tampil.map((w) => w.kata), ['buku', 'kursi']);
  assert.deepEqual(tertunda.map((w) => w.kata), ['siang']);
});

test('kata acak setelah kunci mati buatan bot ikut ditahan', () => {
  const rantai = [
    { kata: 'kursi', pemain: 'user', created_at: t(100) },
    { kata: 'siaga', pemain: 'bot', created_at: t(3_000) },
    { kata: 'meja', pemain: 'sistem', created_at: t(3_000) },
  ];
  assert.deepEqual(pisahTertunda(rantai, 1_000).tertunda.map((w) => w.kata), ['siaga', 'meja']);
});

test('kata bot yang sudah lewat waktunya tampil', () => {
  const rantai = [
    { kata: 'kursi', pemain: 'user', created_at: t(100) },
    { kata: 'siang', pemain: 'bot', created_at: t(500) },
  ];
  assert.deepEqual(pisahTertunda(rantai, 1_000).tertunda, []);
});
