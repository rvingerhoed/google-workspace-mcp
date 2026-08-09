#!/usr/bin/env node
/**
 * Build-time coverage analysis tool (ADR-100).
 *
 * Compares the curated manifest against Google's actual published API surface
 * to produce a structured coverage report.
 *
 * Usage:
 *   node build/coverage/analyze.js           # print coverage report
 *   node build/coverage/analyze.js --update   # also update baseline file
 *   node build/coverage/analyze.js --json     # output as JSON
 */
export {};
