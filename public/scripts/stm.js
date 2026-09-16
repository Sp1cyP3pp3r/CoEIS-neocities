$(function () {
  const checkboxSelector = ".point-container input[type='checkbox']";

  $(document).on("mousedown", checkboxSelector, function (e) {
    const $box = $(this);
    const $container = $box.closest(".point-container");
    const $boxes = $container.find("input[type='checkbox']");
    const index = $boxes.index(this);

    // =============================================================
    // LEFT MOUSE BUTTON
    // =============================================================
    if (e.button === 0) {
      e.preventDefault();

      // -----------------------------------------------------------
      // LMB on INDETERMINATE
      //
      // This box becomes CHECKED.
      // INDETERMINATE boxes to the right stay INDETERMINATE.
      // -----------------------------------------------------------
      if (this.indeterminate) {
        this.indeterminate = false;
        this.checked = true;

        // Everything to the left is also checked.
        $boxes.slice(0, index).each(function () {
          if (!this.disabled) {
            this.checked = true;
            this.indeterminate = false;
          }
        });

        return;
      }

      // -----------------------------------------------------------
      // LMB on CHECKED
      //
      // If there is an indeterminate region to the right,
      // the boxes we would normally clear become indeterminate.
      //
      // Otherwise they simply become unchecked.
      // -----------------------------------------------------------
      if (this.checked) {
        const hasIndeterminateRight = $boxes
          .slice(index + 1)
          .toArray()
          .some(function (box) {
            return box.indeterminate;
          });

        $boxes.slice(index + 1).each(function () {
          if (this.disabled) return;

          this.checked = false;
          this.indeterminate = hasIndeterminateRight;
        });

        return;
      }

      // -----------------------------------------------------------
      // LMB on UNCHECKED
      //
      // Fill everything from the left through this box.
      // -----------------------------------------------------------
      $boxes.slice(0, index + 1).each(function () {
        if (this.disabled) return;

        this.checked = true;
        this.indeterminate = false;
      });

      return;
    }

    // =============================================================
    // MIDDLE MOUSE BUTTON
    // =============================================================
    if (e.button === 1) {
      e.preventDefault();

      // -----------------------------------------------------------
      // MMB on CHECKED
      //
      // This box AND every checked box to its right become
      // INDETERMINATE.
      // -----------------------------------------------------------
      if (this.checked && !this.indeterminate) {
        $boxes.slice(index).each(function () {
          if (this.disabled) return;

          if (this.checked) {
            this.checked = false;
            this.indeterminate = true;
          }
        });

        return;
      }

      // -----------------------------------------------------------
      // MMB on INDETERMINATE
      //
      // Already indeterminate, so don't change anything.
      // -----------------------------------------------------------
      if (this.indeterminate) {
        return;
      }

      // -----------------------------------------------------------
      // MMB on UNCHECKED
      //
      // Make unchecked boxes from the left through this box
      // indeterminate.
      // -----------------------------------------------------------
      $boxes.slice(0, index + 1).each(function () {
        if (this.disabled) return;

        if (!this.checked) {
          this.indeterminate = true;
        }
      });

      return;
    }

    // =============================================================
    // RIGHT MOUSE BUTTON
    // =============================================================
    if (e.button === 2) {
      e.preventDefault();

      // Disable this box and EVERYTHING to its right.
      $boxes.slice(index).each(function () {
        this.checked = false;
        this.indeterminate = false;
        this.disabled = true;
      });

      return;
    }
  });

  // ===============================================================
  // RIGHT CLICK
  //
  // Needed because the context menu can otherwise appear.
  // ===============================================================
  $(document).on("contextmenu", ".point-container", function (e) {
    e.preventDefault();
  });

  // ===============================================================
  // MIDDLE CLICK
  //
  // Prevent browser autoscroll / auxclick behavior.
  // ===============================================================
  $(document).on("auxclick", checkboxSelector, function (e) {
    if (e.button === 1) {
      e.preventDefault();
    }
  });
});
