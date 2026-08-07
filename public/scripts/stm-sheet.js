$(function () {
  $(document).on("change", ".point-container .point-checkbox", function () {
    const $container = $(this).closest(".point-container");
    const $checkboxes = $container.find(".point-checkbox");
    const index = $checkboxes.index(this);

    if (this.checked) {
      // Clicked an UNCHECKED box → fill left (including current), clear right
      $checkboxes.slice(0, index + 1).prop("checked", true);
      $checkboxes.slice(index + 1).prop("checked", false);
    } else {
      // Clicked a CHECKED box (browser already unchecked it)
      const hasCheckedAfter =
        $checkboxes.slice(index + 1).filter(":checked").length > 0;

      if (hasCheckedAfter) {
        // There are checked boxes after → re-check the clicked box, uncheck only after
        $checkboxes.eq(index).prop("checked", true);
        $checkboxes.slice(index + 1).prop("checked", false);
      }
      // else: no checked boxes after → browser already unchecked it, do nothing
    }

    // Update .point-total
    const totalCount = $container.find(".point-checkbox:checked").length;
    const $total = $container.find(".point-total").length
      ? $container.find(".point-total")
      : $container.siblings(".point-total");
    $total.text(totalCount);
  });
});

/* LIGHT & HEAVY DAMAGE FORMATING */
$(function () {
  const $inputs = $("#light-damage-input, #heavy-damage-input");

  $inputs.each(function () {
    const $input = $(this);

    // Clear previous input before entering new number
    $input.on("focus", function () {
      $(this).select();
    });

    $input.on("input", function () {
      let value = $(this).val();

      // Delete spaces and any non-digit characters
      value = value.replace(/\D/g, "");

      // Trim 0 in the front ("05" -> "5", but leaves a single "0" alone)
      value = value.replace(/^0+(?=\d)/, "");

      // Prevent completely empty input while typing
      if (value === "") value = "0";

      $(this).val(value);
    });

    // Default to 0 if cleared on blur
    $input.on("blur", function () {
      if ($(this).val().trim() === "") {
        $(this).val("0");
      }
    });
  });
});

(function ($) {
  $(function () {
    const $damageBlocks = $("#fight-damage .damage-block");

    function getMax($block) {
      const max = parseInt($block.find(".damage-max").first().text(), 10);
      return Number.isFinite(max) && max >= 0 ? max : 0;
    }

    function getInputValue($block) {
      const raw = String($block.find(".damage-input").val() || "").replace(
        /[^0-9]/g,
        "",
      );

      const value = parseInt(raw, 10);
      return Number.isFinite(value) ? value : 0;
    }

    function clampValue($block, value) {
      const max = getMax($block);
      value = parseInt(value, 10) || 0;

      return Math.max(0, Math.min(value, max));
    }

    function renderInput($block, value) {
      value = clampValue($block, value);
      $block.find(".damage-input").val(value);

      return value;
    }

    function renderCheckboxes($block, value) {
      value = clampValue($block, value);

      $block.find(".damage-checkbox").prop("checked", function () {
        return Number($(this).data("value")) <= value;
      });

      return value;
    }

    function renderDamage($block, value) {
      value = clampValue($block, value);

      renderInput($block, value);
      renderCheckboxes($block, value);

      return value;
    }

    function buildCheckboxes($block) {
      const max = getMax($block);
      const current = getInputValue($block);
      const $points = $block.find(".damage-points").empty();

      for (let i = 1; i <= max; i++) {
        $("<input>", {
          type: "checkbox",
          class: "point-checkbox damage-checkbox",
          "data-value": i,
        }).appendTo($points);
      }

      renderDamage($block, current);
    }

    function buildAllDamageCheckboxes() {
      $damageBlocks.each(function () {
        buildCheckboxes($(this));
      });
    }

    $(document).on("input", "#fight-damage .damage-input", function () {
      const $input = $(this);
      const $block = $input.closest(".damage-block");

      const clean = String($input.val() || "").replace(/[^0-9]/g, "");

      if (clean !== $input.val()) {
        $input.val(clean);
      }

      renderDamage($block, clean === "" ? 0 : parseInt(clean, 10));
    });

    $(document).on("blur", "#fight-damage .damage-input", function () {
      const $block = $(this).closest(".damage-block");
      renderInput($block, getInputValue($block));
    });

    $(document).on("change", "#fight-damage .damage-checkbox", function () {
      const $box = $(this);
      const $block = $box.closest(".damage-block");

      const clickedValue = Number($box.data("value"));
      const newValue = $box.prop("checked") ? clickedValue : clickedValue - 1;

      renderDamage($block, newValue);
    });

    const damageMaxObserver = new MutationObserver(function (mutations) {
      const blocksToUpdate = new Set();

      mutations.forEach(function (mutation) {
        const node = mutation.target;

        const element =
          node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

        const $max = $(element).closest(".damage-max");

        if ($max.length) {
          const block = $max.closest(".damage-block")[0];

          if (block) {
            blocksToUpdate.add(block);
          }
        }
      });

      blocksToUpdate.forEach(function (block) {
        buildCheckboxes($(block));
      });
    });

    $("#fight-damage .damage-max").each(function () {
      damageMaxObserver.observe(this, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });

    window.STM = window.STM || {};

    window.STM.setDamageMax = function (damageType, newMax) {
      const $block = $("#fight-damage #" + damageType + "-damage");

      if (!$block.length) {
        return;
      }

      newMax = Math.max(0, parseInt(newMax, 10) || 0);

      $block.find(".damage-max").text(newMax);

      if (!("MutationObserver" in window)) {
        buildCheckboxes($block);
      }
    };

    buildAllDamageCheckboxes();
  });
})(jQuery);
