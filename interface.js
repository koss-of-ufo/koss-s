// Функционал интерфейса для скрытия/показа элементов BNR
document.addEventListener("DOMContentLoaded", function () {
  // Находим блоки BNR-Up и BNR-Down по классу 'bnr-group'
  const bnrGroups = document.querySelectorAll(".bnr-group");

  if (bnrGroups.length > 0) {
    // Находим блок main-controls для размещения кнопки БНР
    const mainControlsBlock = document.querySelector(".main-controls");

    // Создаем кнопку БНР
    const bnrButton = document.createElement("button");
    bnrButton.textContent = "БНР";
    bnrButton.className = "submit-btn"; // Используем тот же класс, что и у других кнопок
    bnrButton.title = "Показать/скрыть управление БНР";

    // Добавляем кнопку в main-controls
    if (mainControlsBlock) {
      mainControlsBlock.appendChild(bnrButton);
    } else {
      console.warn(
        "Блок main-controls не найден, невозможно добавить кнопку БНР"
      );
    }

    // Скрываем блоки BNR-группы при загрузке страницы
    bnrGroups.forEach((group) => {
      group.style.display = "none";
    });

    // Добавляем обработчик клика по кнопке
    bnrButton.addEventListener("click", function () {
      // Получаем текущее состояние видимости
      const isVisible = bnrGroups[0]?.style.display === "block";

      // Переключаем видимость каждой группы
      bnrGroups.forEach((group) => {
        group.style.display = isVisible ? "none" : "block";
      });

      // Обновляем вид кнопки в зависимости от состояния
      if (!isVisible) {
        this.classList.add("active-bnr-button");
      } else {
        this.classList.remove("active-bnr-button");
      }
    });

    // Добавляем стиль для активной кнопки
    const style = document.createElement("style");
    style.textContent = `
            .active-bnr-button {
                border: 1px solid #007bff !important;
                background-color: #fff !important;
                color: #007bff !important;
            }
        `;
    document.head.appendChild(style);
  } else {
    console.warn("Блоки BNR не найдены. Проверьте структуру HTML.");
  }
});
