$(function () {
  // 1. Делегирование событий: один слушатель для любого .point-container
  // (используем $(document), чтобы работало даже при динамическом добавлении элементов)
  $(document).on("change", ".point-container .point-checkbox", function () {
    const $container = $(this).closest(".point-container");
    const $li = $(this).closest("li");
    const $checkboxes = $li.find(".point-checkbox");
    const index = $checkboxes.index(this);

    if (this.checked) {
      // Пользователь отметил пустой чекбокс:
      // Отмечаем текущий и все СЛЕВА от него
      $checkboxes.slice(0, index + 1).prop("checked", true);
      // Снимаем отметку со всех СПРАВА от него (чтобы блок оставался сплошным)
      $checkboxes.slice(index + 1).prop("checked", false);
    } else {
      // Пользователь снял отметку с уже отмеченного чекбокса:
      // Снимаем отметку с текущего и всех СПРАВА от него
      $checkboxes.slice(index).prop("checked", false);
    }

    // 2. Обновляем .point-total
    // Считаем все отмеченные чекбоксы внутри этого .point-container
    const totalCount = $container.find(".point-checkbox:checked").length;

    // Находим .point-total (поддерживаем оба варианта: когда он внутри контейнера или является соседним элементом)
    const $total = $container.find(".point-total").length
      ? $container.find(".point-total")
      : $container.siblings(".point-total");

    $total.text(totalCount);
  });
});
