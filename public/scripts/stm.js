$(function () {
  const selector = ".point-container input[type='checkbox']";

  // Prevent the browser's native checkbox behavior for all
  // mouse buttons. We handle the state ourselves.
  $(document).on("mousedown", selector, function (e) {
    const $container = $(this).closest(".point-container");
    const $checkboxes = $container.find("input[type='checkbox']");
    const index = $checkboxes.index(this);

    // ============================================================
    // LEFT MOUSE BUTTON
    // ============================================================
    if (e.button === 0) {
      e.preventDefault();

      const $box = $checkboxes.eq(index);

      // ----------------------------------------------------------
      // LMB on INDETERMINATE
      //
      // This box becomes checked.
      // Indeterminate boxes to the right stay indeterminate.
      // ----------------------------------------------------------
      if (this.indeterminate) {
        this.indeterminate = false;
        this.checked = true;

        return;
      }

      // ----------------------------------------------------------
      // LMB on CHECKED
      //
      // Normally, clicking a checked box clears everything to
      // the right.
      //
      // However, if there are indeterminate boxes to the right,
      // the boxes that would normally be cleared become
      // indeterminate instead.
      // ----------------------------------------------------------
      if (this.checked) {
        const $right = $checkboxes.slice(index + 1);

        const hasIndeterminateRight =
          $right.filter(function () {
            return this.indeterminate;
          }).length > 0;

        $right.each(function () {
          if (hasIndeterminateRight) {
            this.checked = false;
            this.indeterminate = true;
          } else {
            this.checked = false;
            this.indeterminate = false;
          }
        });

        return;
      }

      // ----------------------------------------------------------
      // LMB on UNCHECKED
      //
      // Fill everything up to and including this box.
      // Clear normal checked/indeterminate states to the right.
      // ----------------------------------------------------------
      $checkboxes.slice(0, index + 1).each(function () {
        this.checked = true;
        this.indeterminate = false;
      });

      $checkboxes.slice(index + 1).each(function () {
        this.checked = false;
        this.indeterminate = false;
      });

      return;
    }

    // ============================================================
    // MIDDLE MOUSE BUTTON
    // ============================================================
    if (e.button === 1) {
      e.preventDefault();

      // ----------------------------------------------------------
      // MMB on CHECKED
      //
      // This box and every CHECKED box to its right become
      // indeterminate.
      //
      // Unchecked boxes are left alone.
      // ----------------------------------------------------------
      if (this.checked && !this.indeterminate) {
        $checkboxes.slice(index).each(function () {
          if (this.checked) {
            this.checked = false;
            this.indeterminate = true;
          }
        });

        return;
      }

      // ----------------------------------------------------------
      // MMB on INDETERMINATE
      //
      // Keep the indeterminate state and propagate it to
      // indeterminate boxes to the right.
      // ----------------------------------------------------------
      if (this.indeterminate) {
        $checkboxes.slice(index).each(function () {
          if (this.indeterminate) {
            this.checked = false;
            this.indeterminate = true;
          }
        });

        return;
      }

      // ----------------------------------------------------------
      // MMB on UNCHECKED
      //
      // Make this box and everything to its left indeterminate,
      // without touching already-checked boxes.
      // ----------------------------------------------------------
      $checkboxes.slice(0, index + 1).each(function () {
        if (!this.checked) {
          this.indeterminate = true;
        }
      });

      return;
    }

    // ============================================================
    // RIGHT MOUSE BUTTON
    // ============================================================
    if (e.button === 2) {
      e.preventDefault();

      // Disable from RIGHT → LEFT:
      // clicked box + everything to its LEFT.
      $checkboxes.slice(0, index + 1).each(function () {
        this.disabled = true;
      });

      return;
    }
  });

  // Prevent the browser's context menu on the skill boxes.
  $(document).on("contextmenu", selector, function (e) {
    e.preventDefault();
  });

  // Prevent middle-click autoscroll / auxclick behavior.
  $(document).on("auxclick", selector, function (e) {
    if (e.button === 1) {
      e.preventDefault();
    }
  });
});
