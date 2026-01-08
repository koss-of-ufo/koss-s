function generateIP() {
  let pvp = document.getElementById("pvp").value;
  let band = document.getElementById("band").value;
  let right = document.getElementById("right").checked;
  let location = document.getElementById("location")?.value || "khabarovsk"; // По умолчанию используем Хабаровск
  let m11Section = document.getElementById("m11-section")?.value || ""; // Для разделов М11
  let parentSection = document.getElementById("parent-section")?.value || ""; // Родительская секция
  let base = 0;
  let ip = "";

  // Проверяем, что ПВП и полоса выбраны
  if (!pvp || !band) {
    alert("Пожалуйста, выберите ПВП и полосу");
    return;
  }

  // Генерация IP для Хабаровска
  if (location === "khabarovsk") {
    if (pvp < 1 || pvp > 5) {
      alert("ПВП должно быть от 1 до 5");
      return;
    }

    base = (pvp - 1) * 16;

    if (band.startsWith("e")) {
      let num = parseInt(band.substring(1));
      if (num < 51 || num > 55) {
        alert("E-полоса должна быть от e51 до e55");
        return;
      }
      let offset = (num - 51) * 10;
      ip = `10.0.${base}.${11 + offset}`;
      if (right) {
        ip = `10.0.${base}.${10 + offset}`;
      }
    } else if (band.startsWith("x")) {
      let num = parseInt(band.substring(1));
      if (num < 1 || num > 10) {
        alert("X-полоса должна быть от x01 до x10");
        return;
      }
      let offset = (num - 1) * 10;
      ip = `10.0.${base + 1}.${11 + offset}`;
    } else {
      alert("Неверный формат полосы");
      return;
    }
  }
  // Генерация IP для M11
  else if (location === "m11") {
    if (pvp !== "47") {
      alert("Для М11 доступен только ПВП 47");
      return;
    }
    
    if (!m11Section) {
      alert("Выберите секцию М11");
      return;
    }
    
    // Для ПВП-47 и разных секций разные IP-адреса
    if (band.startsWith("e")) {
      let num = parseInt(band.substring(1));
      
      // Проверка допустимых значений полос в зависимости от секции
      if (m11Section === "97" && (num < 51 || num > 52)) {
        alert("Для секции 97км доступны только полосы e51-e52");
        return;
      } else if (m11Section === "67" && (num < 51 || num > 55)) {
        alert("Для секции 67км доступны полосы e51-e55");
        return;
      } else if (m11Section === "124" && (num < 51 || num > 52)) {
        alert("Для секции 124км доступны только полосы e51-e52");
        return;
      } else if (m11Section === "147" && (num < 51 || num > 57)) {
        alert("Для секции 147км доступны полосы e51-e57");
        return;
      } else if ((m11Section === "348" || m11Section === "402" || m11Section === "444" || m11Section === "524") && (num < 51 || num > 52)) {
        alert(`Для секции ${m11Section}км доступны только полосы e51-e52`);
        return;
      } else if (m11Section === "668" && (num < 51 || num > 55)) {
        alert("Для секции 668км доступны полосы e51-e55");
        return;
      } else if ((m11Section !== "67" && m11Section !== "97" && m11Section !== "124" && m11Section !== "147" && 
                 m11Section !== "348" && m11Section !== "402" && m11Section !== "444" && m11Section !== "524" && 
                 m11Section !== "668") && (num < 51 || num > 54)) {
        alert("E-полоса для М11 должна быть от e51 до e54");
        return;
      }
      
      // Базовый IP и третий октет в зависимости от секции
      let baseIP = "10.136.0";
      let thirdOctet = 0;
      
      // Определяем базовый IP в зависимости от секции
      switch (m11Section) {
        // Секция 0
        case "0": // ПВП 47 - это секция 0
          baseIP = "10.136.0";
          break;
          
        // Секция 1 и её подсекции
        case "58":
          baseIP = "10.131.0";
          break;
        case "67":
          baseIP = "10.131.16";
          break;
        case "89":
          baseIP = "10.131.32";
          break;
        case "97":
          baseIP = "10.131.48";
          break;
          
        // Секция 2 и её подсекции
        case "124":
          baseIP = "10.131.64";
          break;
        case "147":
          baseIP = "10.131.80";
          break;
          
        // Секция 6 и её подсекции
        case "348":
          baseIP = "10.135.0";
          break;
        case "402":
          baseIP = "10.135.16";
          break;
        case "444":
          baseIP = "10.135.32";
          break;
        case "524":
          baseIP = "10.135.48";
          break;
          
        // Отдельная секция 668
        case "668":
          baseIP = "10.128.0";
          thirdOctet = 0;
          break;
          
        // Для старых обозначений секций (1, 2, 6) - теперь используются как родительские
        case "1":
          if (parentSection === "1") {
            baseIP = "10.136.0";
            thirdOctet = 100;
          } else {
            alert("Выберите конкретный километр для секции 1");
            return;
          }
          break;
        case "2":
          if (parentSection === "2") {
            baseIP = "10.136.0";
            thirdOctet = 200;
          } else {
            alert("Выберите конкретный километр для секции 2");
            return;
          }
          break;
        case "6":
          if (parentSection === "6") {
            baseIP = "10.136.0";
            thirdOctet = 300;
          } else {
            alert("Выберите конкретный километр для секции 6");
            return;
          }
          break;
          
        default:
          alert("Неизвестная секция М11");
          return;
      }
      
      // Для e51 - базовый_IP.11, e52 - базовый_IP.21, e53 - базовый_IP.31 и т.д.
      let laneOffset = (num - 51) * 10 + 1;
      
      // Для старых секций (0, 1, 2, 6, 668) используем смещение в последнем октете
      if (["0", "1", "2", "6", "668"].includes(m11Section) && !["58", "67", "89", "97", "124", "147", "348", "402", "444", "524"].includes(m11Section)) {
        ip = `${baseIP}.${10 + laneOffset + thirdOctet}`;
      } else {
        // Для подсекций используем фиксированный третий октет
        ip = `${baseIP}.${10 + laneOffset}`;
      }
    } else if (band.startsWith("x")) {
      let num = parseInt(band.substring(1));
      
      // Проверка допустимых значений полос в зависимости от секции
      if (m11Section === "97" && (num < 1 || num > 2)) {
        alert("Для секции 97км доступны только полосы x01-x02");
        return;
      } else if (m11Section === "89" && (num < 1 || num > 5)) {
        alert("Для секции 89км доступны полосы x01-x05");
        return;
      } else if (m11Section === "58" && (num < 1 || num > 7)) {
        alert("Для секции 58км доступны полосы x01-x07");
        return;
      } else if (m11Section === "124" && (num < 1 || num > 4)) {
        alert("Для секции 124км доступны полосы x01-x04");
        return;
      } else if (m11Section === "147" && (num < 1 || num > 9)) {
        alert("Для секции 147км доступны полосы x01-x09");
        return;
      } else if ((m11Section === "348" || m11Section === "402") && (num < 1 || num > 3)) {
        alert(`Для секции ${m11Section}км доступны полосы x01-x03`);
        return;
      } else if ((m11Section === "444" || m11Section === "524") && (num < 1 || num > 2)) {
        alert(`Для секции ${m11Section}км доступны полосы x01-x02`);
        return;
      } else if (m11Section === "668" && (num < 1 || num > 9)) {
        alert("Для секции 668км доступны полосы x01-x09");
        return;
      } else if ((m11Section !== "97" && m11Section !== "89" && m11Section !== "58" && 
                 m11Section !== "124" && m11Section !== "147" && m11Section !== "348" && 
                 m11Section !== "402" && m11Section !== "444" && m11Section !== "524" &&
                 m11Section !== "668") && (num < 1 || num > 6)) {
        alert("X-полоса для М11 должна быть от x01 до x06");
        return;
      }
      
      // Базовый IP и третий октет в зависимости от секции
      let baseIP = "10.136.1";
      let thirdOctet = 0;
      
      // Определяем базовый IP в зависимости от секции
      switch (m11Section) {
        // Секция 0
        case "0": // ПВП 47 - это секция 0
          baseIP = "10.136.1";
          break;
          
        // Секция 1 и её подсекции
        case "58":
          baseIP = "10.131.1";
          break;
        case "67":
          baseIP = "10.131.17";
          break;
        case "89":
          baseIP = "10.131.33";
          break;
        case "97":
          baseIP = "10.131.49";
          break;
          
        // Секция 2 и её подсекции
        case "124":
          baseIP = "10.131.65";
          break;
        case "147":
          baseIP = "10.131.81";
          break;
          
        // Секция 6 и её подсекции
        case "348":
          baseIP = "10.135.1";
          break;
        case "402":
          baseIP = "10.135.17";
          break;
        case "444":
          baseIP = "10.135.33";
          break;
        case "524":
          baseIP = "10.135.49";
          break;
          
        // Отдельная секция 668
        case "668":
          baseIP = "10.128.1";
          thirdOctet = 0;
          break;
          
        // Для старых обозначений секций (1, 2, 6) - теперь используются как родительские
        case "1":
          if (parentSection === "1") {
            baseIP = "10.136.1";
            thirdOctet = 100;
          } else {
            alert("Выберите конкретный километр для секции 1");
            return;
          }
          break;
        case "2":
          if (parentSection === "2") {
            baseIP = "10.136.1";
            thirdOctet = 200;
          } else {
            alert("Выберите конкретный километр для секции 2");
            return;
          }
          break;
        case "6":
          if (parentSection === "6") {
            baseIP = "10.136.1";
            thirdOctet = 300;
          } else {
            alert("Выберите конкретный километр для секции 6");
            return;
          }
          break;
          
        default:
          alert("Неизвестная секция М11");
          return;
      }
      
      // Для x01 - базовый_IP.11, x02 - базовый_IP.21, x03 - базовый_IP.31 и т.д.
      let laneOffset = (num - 1) * 10 + 1;
      
      // Для старых секций (0, 1, 2, 6, 668) используем смещение в последнем октете
      if (["0", "1", "2", "6", "668"].includes(m11Section) && !["58", "67", "89", "97", "124", "147", "348", "402", "444", "524"].includes(m11Section)) {
        ip = `${baseIP}.${10 + laneOffset + thirdOctet}`;
      } else {
        // Для подсекций используем фиксированный третий октет
        ip = `${baseIP}.${10 + laneOffset}`;
      }
    } else {
      alert("Неверный формат полосы");
      return;
    }
  } else {
    alert("Неизвестная локация");
    return;
  }

  document.getElementById("result").textContent = `Сгенерированный IP: ${ip}`;
  document.getElementById("ip").value = ip;
}
