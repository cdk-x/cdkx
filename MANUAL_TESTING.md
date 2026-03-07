# Manual Testing Guide for cdkx destroy

This document provides a comprehensive manual testing checklist for the `cdkx destroy` command implementation.

## Prerequisites

- Hetzner Cloud API token set as `HETZNER_TOKEN` environment variable
- Example app built: `cd examples/hetzner-basic && yarn build`
- CLI built: `yarn nx build @cdkx-io/cli`

## Test Scenarios

### 1. Confirmation Prompt - User Declines

**Purpose:** Verify that typing 'n' or any non-yes response cancels the destroy operation.

**Steps:**

```bash
cd examples/hetzner-basic
export HETZNER_TOKEN="your-token-here"

# First deploy some resources
node ../../packages/cli/dist/main.js deploy

# Try to destroy and type 'n' when prompted
node ../../packages/cli/dist/main.js destroy
# When prompted "Are you sure you want to continue? (y/N):", type 'n' and press Enter
```

**Expected Results:**

- ✅ Confirmation prompt displays warning with stack list
- ✅ Prompt shows: "Are you sure you want to continue? (y/N):"
- ✅ After typing 'n': prints "Destroy cancelled."
- ✅ Exit code 0 (success - user cancelled intentionally)
- ✅ No resources deleted
- ✅ State file unchanged (`.cdkx/engine-state.json`)
- ✅ No DELETE events emitted

**Test Variations:**

- Type 'N' (uppercase)
- Type 'no'
- Type 'nope'
- Press Enter without typing anything (should default to No)
- Type random text like 'maybe' or 'cancel'

### 2. Confirmation Prompt - User Accepts

**Purpose:** Verify that typing 'y' or 'yes' proceeds with destruction.

**Steps:**

```bash
cd examples/hetzner-basic

# Try to destroy and type 'y' when prompted
node ../../packages/cli/dist/main.js destroy
# When prompted, type 'y' and press Enter
```

**Expected Results:**

- ✅ Confirmation prompt displays
- ✅ After typing 'y': destroy proceeds immediately
- ✅ Real-time DELETE events stream to console
- ✅ Resources deleted in reverse dependency order:
  1. WebServer (DELETE_IN_PROGRESS → DELETE_COMPLETE)
  2. WebLB (DELETE_IN_PROGRESS → DELETE_COMPLETE)
  3. NewRoute (DELETE_IN_PROGRESS → DELETE_COMPLETE)
  4. WebSubnet (DELETE_IN_PROGRESS → DELETE_COMPLETE)
  5. Network (DELETE_IN_PROGRESS → DELETE_COMPLETE)
- ✅ Stack transitions: DELETE_IN_PROGRESS → DELETE_COMPLETE
- ✅ Final message: "✔ All resources destroyed"
- ✅ Exit code 0
- ✅ State file cleaned up (resources removed as they're deleted)

**Test Variation:**

- Type 'yes' (full word) - should also proceed
- Type 'Y' (uppercase)
- Type 'YES' (uppercase full word)

### 3. Force Flag - Skip Confirmation

**Purpose:** Verify that `--force` flag skips the confirmation prompt entirely.

**Steps:**

```bash
cd examples/hetzner-basic

# First deploy resources again
node ../../packages/cli/dist/main.js deploy

# Destroy with --force flag (no prompt should appear)
node ../../packages/cli/dist/main.js destroy --force
```

**Expected Results:**

- ✅ No confirmation prompt shown
- ✅ Destroy proceeds immediately
- ✅ Resources deleted successfully
- ✅ Final message: "✔ All resources destroyed"
- ✅ Exit code 0

### 4. Re-run Destroy on Already Destroyed Stack

**Purpose:** Verify idempotency - running destroy twice should be safe.

**Steps:**

```bash
cd examples/hetzner-basic

# First destroy
echo "y" | node ../../packages/cli/dist/main.js destroy

# Immediately run destroy again
echo "y" | node ../../packages/cli/dist/main.js destroy
```

**Expected Results:**

- ✅ Second destroy shows confirmation prompt
- ✅ No resources to delete (all already removed from state)
- ✅ Stack transitions: DELETE_IN_PROGRESS → DELETE_COMPLETE
- ✅ No DELETE events for individual resources
- ✅ Final message: "✔ All resources destroyed"
- ✅ Exit code 0
- ✅ No API errors (no 404s)

### 5. Partial Destroy Failure - Best Effort

**Purpose:** Verify that destroy continues even when some resources fail.

**Steps:**

```bash
cd examples/hetzner-basic

# Deploy resources
node ../../packages/cli/dist/main.js deploy

# Manually delete one resource via Hetzner Cloud Console (e.g., the WebServer)
# This will cause a 404 when cdkx tries to delete it

# Run destroy
echo "y" | node ../../packages/cli/dist/main.js destroy
```

**Expected Results:**

- ✅ WebServer deletion fails with DELETE_FAILED (404 error)
- ✅ Destroy continues with remaining resources (best-effort)
- ✅ Other resources deleted successfully
- ✅ Stack transitions to DELETE_FAILED (because at least one resource failed)
- ✅ Error message shows which resource(s) failed
- ✅ Exit code 1 (failure)
- ✅ State file updated: failed resource still in state, successful deletes removed

### 6. Concurrent Deploy/Destroy Lock

**Purpose:** Verify that the deploy lock prevents concurrent operations.

**Steps:**

```bash
cd examples/hetzner-basic

# Terminal 1: Start a destroy (will take time due to Hetzner API)
echo "y" | node ../../packages/cli/dist/main.js destroy &

# Terminal 2: Immediately try to run another destroy
sleep 2
echo "y" | node ../../packages/cli/dist/main.js destroy
```

**Expected Results:**

- ✅ Second command fails with LockError
- ✅ Error message shows:
  - "Deploy already in progress (pid <pid> on <hostname>, started <timestamp>)"
  - Lock file path
  - Suggestion to delete lock if process is no longer running
- ✅ Exit code 1
- ✅ First destroy completes successfully
- ✅ After first completes, second destroy (if retried) works

### 7. Custom Output Directory

**Purpose:** Verify --output flag works correctly.

**Steps:**

```bash
cd examples/hetzner-basic

# Synth to custom directory
node ../../packages/cli/dist/main.js synth --output custom-out

# Deploy from custom directory
node ../../packages/cli/dist/main.js deploy --output custom-out

# Destroy using custom directory
echo "y" | node ../../packages/cli/dist/main.js destroy --output custom-out
```

**Expected Results:**

- ✅ Reads manifest from `custom-out/manifest.json`
- ✅ Resources destroyed successfully
- ✅ State file still in `.cdkx/` (stateDir is always relative to cdkx.json)

### 8. Custom Config File

**Purpose:** Verify --config flag works correctly.

**Steps:**

```bash
cd examples/hetzner-basic

# Create alternate config
cp cdkx.json cdkx.test.json

# Synth with custom config
node ../../packages/cli/dist/main.js synth --config cdkx.test.json

# Deploy with custom config
node ../../packages/cli/dist/main.js deploy --config cdkx.test.json

# Destroy with custom config
echo "y" | node ../../packages/cli/dist/main.js destroy --config cdkx.test.json
```

**Expected Results:**

- ✅ Reads config from `cdkx.test.json`
- ✅ Resources destroyed successfully
- ✅ State file in `.cdkx/` next to config file

### 9. Config File Not Found

**Purpose:** Verify error handling for missing config file.

**Steps:**

```bash
cd examples/hetzner-basic
node ../../packages/cli/dist/main.js destroy --config nonexistent.json
```

**Expected Results:**

- ✅ Error message: "Config file not found: <path>/nonexistent.json"
- ✅ Exit code 1
- ✅ No confirmation prompt shown (fails before that point)

### 10. Missing App Field in Config

**Purpose:** Verify validation of config file contents.

**Steps:**

```bash
cd examples/hetzner-basic

# Create invalid config
echo '{"output":"cdkx.out"}' > cdkx.invalid.json

node ../../packages/cli/dist/main.js destroy --config cdkx.invalid.json
```

**Expected Results:**

- ✅ Error message: "'app' field is required in cdkx.json"
- ✅ Exit code 1

### 11. Assembly Directory Not Found

**Purpose:** Verify error handling for missing cloud assembly.

**Steps:**

```bash
cd examples/hetzner-basic

# Remove assembly directory
rm -rf cdkx.out

node ../../packages/cli/dist/main.js destroy --force
```

**Expected Results:**

- ✅ Error message indicating manifest.json not found
- ✅ Exit code 1

### 12. Empty Stack (No Resources)

**Purpose:** Verify behavior when stack has no resources.

**Steps:**

```bash
# Create a minimal example with empty stack
mkdir -p /tmp/cdkx-empty-test
cd /tmp/cdkx-empty-test

# Create minimal app
cat > app.js << 'EOF'
const { App, Stack } = require('@cdkx-io/core');
const { HetznerProvider } = require('@cdkx-io/hetzner');

const app = new App({ outdir: 'cdkx.out' });
new Stack(app, 'EmptyStack', {
  provider: new HetznerProvider(),
});
app.synth();
EOF

cat > cdkx.json << 'EOF'
{
  "app": "node app.js",
  "output": "cdkx.out"
}
EOF

# Synth and destroy
node <path-to-cli>/dist/main.js synth
echo "y" | node <path-to-cli>/dist/main.js destroy
```

**Expected Results:**

- ✅ Destroy proceeds
- ✅ Stack transitions: DELETE_IN_PROGRESS → DELETE_COMPLETE
- ✅ No resource DELETE events
- ✅ Final message: "✔ All resources destroyed"
- ✅ Exit code 0

## Verification Checklist

After running all test scenarios, verify:

- [ ] All confirmation prompt variations work correctly (y/yes/n/no/Enter/etc.)
- [ ] `--force` flag correctly skips confirmation
- [ ] Resources destroyed in correct reverse order (dependencies respected)
- [ ] Real-time event streaming works (no buffering)
- [ ] Deploy lock prevents concurrent operations
- [ ] State file cleaned up correctly after successful destroy
- [ ] Best-effort deletion (failures don't abort remaining deletions)
- [ ] Idempotent (running destroy twice is safe)
- [ ] Error messages are helpful and accurate
- [ ] Exit codes correct (0 for success/cancellation, 1 for errors)
- [ ] Custom --output and --config flags work
- [ ] All edge cases handled gracefully

## Current Test Results

### Automated Tests

✅ **All 81 CLI unit tests pass** (59 existing + 22 new destroy tests)
✅ **All 199 engine tests pass** (including destroy logic)
✅ **All 211 core tests pass**

### Manual Tests Completed

✅ **Confirmation prompt with 'n' response** - Cancels correctly

- Tested with `echo "n"` piped to destroy command
- Output: "Destroy cancelled."
- Exit code: 0
- No resources deleted

### Manual Tests Pending

⏳ **All other scenarios require HETZNER_TOKEN environment variable**

## Notes

- The destroy implementation is complete and all automated tests pass
- Manual testing requires a valid Hetzner Cloud API token
- The example `examples/hetzner-basic` has a partially failed prior destroy attempt in state
- State file shows Network (CREATE_COMPLETE) and WebSubnet (DELETE_FAILED)
- Assembly shows 5 resources (Network, WebSubnet, NewRoute, WebLB, WebServer)
