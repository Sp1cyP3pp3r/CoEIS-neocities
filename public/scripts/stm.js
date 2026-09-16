$(function () {
  const selector = ".point-container input[type='checkbox']";

  // ---------------------------------------------------------------
  // LMB
  // ---------------------------------------------------------------
  $(document).on("click", selector, function (e) {
    const $container = $(this).closest(".point-container");
    const $boxes = $container.find("input[type='checkbox']");
    const index = $boxes.index(this);

    // Ignore clicks that aren't left-clicks.
    if (e.button !== 0) return;

    // Don't allow the browser to mess with our indeterminate state.
    e.preventDefault();

    const wasIndeterminate = this.indeterminate;
    const wasChecked = this.checked;

    if (wasIndeterminate) {
      // -----------------------------------------------------------
      // LMB on INDETERMINATE
      //
      // This box becomes CHECKED.
      // Indeterminate boxes to the right stay INDETERMINATE.
      // -----------------------------------------------------------

      this.indeterminate = false;
      this.checked = true;

      // Everything to the left must remain checked.
      $boxes.slice(0, index).each(function () {
        if (!this.disabled) {
          this.indeterminate = false;
          this.checked = true;
        }
      });
    } else if (wasChecked) {
      // -----------------------------------------------------------
      // LMB on CHECKED
      //
      // Normally this would clear everything to the right.
      //
      // If there is an indeterminate section, however, everything
      // that would normally be cleared becomes INDETERMINATE.
      // -----------------------------------------------------------

      const hasIndeterminateRight =
        $boxes.slice(index + 1).filter(function () {
          return this.indeterminate;
        }).length > 0;

      $boxes.slice(index + 1).each(function () {
        if (this.disabled) return;

        this.checked = false;

        if (hasIndeterminateRight) {
          this.indeterminate = true;
        } else {
          this.indeterminate = false;
        }
      });
    } else {
      // -----------------------------------------------------------
      // LMB on UNCHECKED
      //
      // Fill from the left through this box.
      // -----------------------------------------------------------

      $boxes.slice(0, index + 1).each(function () {
        if (this.disabled) return;

        this.checked = true;
        this.indeterminate = false;
      });
    }
  });

  // ---------------------------------------------------------------
  // MMB
  // ---------------------------------------------------------------
  $(document).on("mousedown", selector, function (e) {
    if (e.button !== 1) return;

    e.preventDefault();

    const $container = $(this).closest(".point-container");
    const $boxes = $container.find(selector);
    const index = $boxes.index(this);

    // -------------------------------------------------------------
    // MMB on CHECKED
    //
    // This box and all CHECKED boxes to its right become
    // INDETERMINATE.
    // -------------------------------------------------------------

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

    // -------------------------------------------------------------
    // MMB on INDETERMINATE
    //
    // Keep the existing indeterminate region.
    // -------------------------------------------------------------

    if (this.indeterminate) {
      return;
    }

    // -------------------------------------------------------------
    // MMB on UNCHECKED
    //
    // Make this box and boxes to its left indeterminate, unless
    // they're already checked.
    // -------------------------------------------------------------

    $boxes.slice(0, index + 1).each(function () {
      if (this.disabled) return;

      if (!this.checked) {
        this.indeterminate = true;
      }
    });
  });

  // ---------------------------------------------------------------
  // RMB
  // ---------------------------------------------------------------
  $(document).on("contextmenu", selector, function (e) {
    e.preventDefault();

    const $container = $(this).closest(".point-container");
    const $boxes = $container.find(selector);
    const index = $boxes.index(this);

    // -------------------------------------------------------------
    // Disable this box and everything to its RIGHT.
    // -------------------------------------------------------------

    $boxes.slice(index).each(function () {
      this.checked = false;
      this.indeterminate = false;
      this.disabled = true;
    });
  });

  // ---------------------------------------------------------------
  // Prevent middle-click's auxclick action.
  // ---------------------------------------------------------------
  $(document).on("auxclick", selector, function (e) {
    if (e.button === 1) {
      e.preventDefault();
    }
  });
});
