# Rejected first attempt

The first approved repair cleared the targeted axe rule but received `REGRESSION_BLOCKED`: the browser gate read Angular-bound invalid/error state before the next change-detection render. The component state had changed, but the DOM assertions ran before the user-visible success text appeared.

The fixture regression was corrected to wait for the exact success message before checking the cleared invalid state and hidden error. A temporary accessible error attribute then proved the full corrected flow, the attribute was removed to restore the barrier, and FormProof started a fresh baseline and repair run. The original rejected run remains under the ignored local `.formproof/runs/angular-error-state` directory.
