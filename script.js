document.addEventListener('DOMContentLoaded', function() {
  // Текущий месяц (0-11)
  let currentMonth = new Date().getMonth();
  
  // Названия месяцев для отображения
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 
    'Май', 'Июнь', 'Июль', 'Август', 
    'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  // Данные бюджета
  let budgetData = JSON.parse(localStorage.getItem('budgetData')) || {
    totalAmount: 0,
    days: 0,
    startDate: null,
    spent: 0,
    dailyHistory: {}
  };

  // Данные накоплений
  let savingsData = JSON.parse(localStorage.getItem('savingsData')) || {
    enabled: false,
    name: '',
    goal: 0,
    current: 0
  };

  // Переменные для графиков
  let chart, capitalChart, yearIncomeChart, yearExpenseChart, yearCapitalChart;
  let miniCapitalChart, miniExpenseChart;

  // Цвета для категорий
  const categoryColors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
    '#9b59b6', '#1abc9c', '#d35400', '#34495e',
    '#16a085', '#27ae60', '#2980b9', '#8e44ad',
    '#f1c40f', '#e67e22', '#c0392b'
  ];

  // DOM элементы
  const elements = {
    incomeInput: document.getElementById('income-input'),
    incomeDisplay: document.getElementById('income'),
    expenseDisplay: document.getElementById('expense'),
    percentDisplay: document.getElementById('percent'),
    capitalDisplay: document.getElementById('capital-display'),
    widgetsContainer: document.getElementById('widgets'),
    addIncomeBtn: document.getElementById('add-income-btn'),
    categoryBtn: document.getElementById('category-btn'),
    categoryMenu: document.getElementById('category-menu'),
    categoriesList: document.getElementById('categories-list'),
    newCategoryInput: document.getElementById('new-category-input'),
    addCategoryBtn: document.getElementById('add-category-btn'),
    capitalizationBtn: document.getElementById('capitalization-btn'),
    capitalizationMenu: document.getElementById('capitalization-menu'),
    capitalInput: document.getElementById('capital-input'),
    saveCapitalBtn: document.getElementById('save-capital-btn'),
    cancelCapitalBtn: document.getElementById('cancel-capital-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsMenu: document.getElementById('settings-menu'),
    monthTabs: document.querySelectorAll('.month-tab'),
    yearSummary: document.getElementById('year-summary'),
    closeYearSummary: document.getElementById('close-year-summary'),
    dailyBudgetAmount: document.getElementById('daily-budget-amount'),
    budgetProgress: document.getElementById('budget-progress'),
    budgetSettingsBtn: document.getElementById('budget-settings-btn'),
    budgetSettingsMenu: document.getElementById('budget-settings-menu'),
    setBudgetBtn: document.getElementById('set-budget-btn'),
    setBudgetModal: document.getElementById('set-budget-modal'),
    budgetAmount: document.getElementById('budget-amount'),
    budgetDays: document.getElementById('budget-days'),
    saveBudgetBtn: document.getElementById('save-budget-btn'),
    cancelBudgetBtn: document.getElementById('cancel-budget-btn'),
    miniCapitalChart: document.getElementById('miniCapitalChart'),
    miniExpenseChart: document.getElementById('miniExpenseChart'),
    avgIncome: document.getElementById('avg-income'),
    avgExpense: document.getElementById('avg-expense'),
    bestMonth: document.getElementById('best-month'),
    topCategoriesList: document.getElementById('top-categories-list'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    moreBtn: document.getElementById('more-btn'),
    moreMenu: document.getElementById('more-menu'),
    enableSavingsBtn: document.getElementById('enable-savings-btn'),
    savingsModal: document.getElementById('savings-modal'),
    savingsName: document.getElementById('savings-name'),
    savingsGoal: document.getElementById('savings-goal'),
    saveSavingsBtn: document.getElementById('save-savings-btn'),
    cancelSavingsBtn: document.getElementById('cancel-savings-btn'),
    closeReportsBtn: document.getElementById('close-reports-btn')
  };

  // Данные приложения
  let financeData = JSON.parse(localStorage.getItem('financeData')) || {};
  
  // Инициализация данных для всех месяцев
  for (let i = 0; i < 12; i++) {
    if (!financeData[i]) {
      financeData[i] = { 
        income: 0, 
        expense: 0, 
        categories: {},
        capital: 0
      };
    }
  }

  // Функция сохранения данных
  function saveData() {
    localStorage.setItem('financeData', JSON.stringify(financeData));
    updateCategoriesList();
  }

  // Форматирование валюты
  function formatCurrency(amount) {
    return amount.toLocaleString('ru-RU') + ' ₽';
  }

  // Обновление списка категорий
  function updateCategoriesList() {
    if (!elements.categoriesList) return;
    
    elements.categoriesList.innerHTML = '';
    const categories = financeData[currentMonth].categories || {};
    
    Object.keys(categories).forEach((category, index) => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';
      categoryItem.innerHTML = `
        <span style="color: ${categoryColors[index % categoryColors.length]}">■</span> ${category}
        <span>${formatCurrency(categories[category])}</span>
        <button class="delete-category-btn" data-category="${category}">×</button>
      `;
      elements.categoriesList.appendChild(categoryItem);
    });

    // Добавляем обработчики для новых кнопок удаления
    document.querySelectorAll('.delete-category-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const category = this.getAttribute('data-category');
        deleteCategory(category);
      });
    });
  }

  // Удаление категории
  function deleteCategory(category) {
    if (confirm(`Удалить категорию "${category}"? Все связанные расходы будут потеряны.`)) {
      const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };
      const categoryExpense = monthData.categories[category] || 0;
      
      monthData.expense -= categoryExpense;
      delete monthData.categories[category];
      
      financeData[currentMonth] = monthData;
      saveData();
      updateUI();
    }
  }

  // Закрытие всех меню
  function closeAllMenus() {
    const menus = [
      elements.categoryMenu,
      elements.capitalizationMenu,
      elements.settingsMenu,
      elements.yearSummary,
      elements.budgetSettingsMenu,
      elements.setBudgetModal,
      elements.moreMenu,
      elements.savingsModal
    ];
    
    menus.forEach(menu => {
      if (menu) menu.classList.remove('show');
    });
  }

  // Обновление меню отчетов
  function updateReportsMenu() {
    if (!elements.settingsMenu) return;
    
    // Средние значения за год
    let totalIncome = 0;
    let totalExpense = 0;
    let bestMonthValue = -Infinity;
    let bestMonthName = 'Нет данных';
    let bestMonthProfit = 0;
    
    for (let i = 0; i < 12; i++) {
      const monthData = financeData[i] || { income: 0, expense: 0 };
      totalIncome += monthData.income || 0;
      totalExpense += monthData.expense || 0;
      
      const profit = monthData.income - monthData.expense;
      if (profit > bestMonthValue) {
        bestMonthValue = profit;
        bestMonthName = monthNames[i];
        bestMonthProfit = profit;
      }
    }
    
    if (elements.avgIncome) {
      elements.avgIncome.textContent = formatCurrency(Math.round(totalIncome / 12));
    }
    
    if (elements.avgExpense) {
      elements.avgExpense.textContent = formatCurrency(Math.round(totalExpense / 12));
    }
    
    if (elements.bestMonth) {
      elements.bestMonth.textContent = `${bestMonthName}\n${formatCurrency(bestMonthProfit)}`;
    }
    
    renderMiniCharts();
    renderTopCategoriesReport();
  }

  // Отрисовка мини-графиков
  function renderMiniCharts() {
    const labels = monthNames.map(name => name.substring(0, 3));
    const capitalData = [];
    const expenseData = [];
    
    for (let i = 0; i < 12; i++) {
      const monthData = financeData[i] || { income: 0, expense: 0, capital: 0 };
      capitalData.push(monthData.capital || 0);
      expenseData.push(monthData.expense || 0);
    }
    
    // График капитализации
    if (miniCapitalChart) miniCapitalChart.destroy();
    if (elements.miniCapitalChart) {
      miniCapitalChart = new Chart(elements.miniCapitalChart.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            data: capitalData,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }]
        },
        options: getChartOptions('Капитализация')
      });
    }
    
    // График расходов
    if (miniExpenseChart) miniExpenseChart.destroy();
    if (elements.miniExpenseChart) {
      miniExpenseChart = new Chart(elements.miniExpenseChart.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: expenseData,
            backgroundColor: 'rgba(231, 76, 60, 0.7)',
            borderColor: 'rgba(231, 76, 60, 1)',
            borderWidth: 1
          }]
        },
        options: getChartOptions('Расходы')
      });
    }
  }

  // Отрисовка топовых категорий
  function renderTopCategoriesReport() {
    if (!elements.topCategoriesList) return;
    
    elements.topCategoriesList.innerHTML = '';
    
    // Собираем данные по месяцам
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthData = financeData[i] || { income: 0, expense: 0, categories: {} };
      const totalExpense = Object.values(monthData.categories).reduce((sum, val) => sum + val, 0);
      if (totalExpense > 0) {
        months.push({
          index: i,
          name: monthNames[i],
          totalExpense: totalExpense,
          categories: Object.entries(monthData.categories)
        });
      }
    }
    
    // Сортируем месяцы по сумме расходов
    months.sort((a, b) => b.totalExpense - a.totalExpense);
    
    // Ограничиваем количество месяцев для отображения
    const topMonths = months.slice(0, 3);
    
    topMonths.forEach(month => {
      const monthElement = document.createElement('div');
      monthElement.className = 'month-categories';
      monthElement.innerHTML = `<h5>${month.name}</h5>`;
      
      // Общая сумма расходов
      const totalElement = document.createElement('div');
      totalElement.className = 'category-item total';
      totalElement.innerHTML = `
        <span>Всего расходов</span>
        <strong>${formatCurrency(month.totalExpense)}</strong>
      `;
      monthElement.appendChild(totalElement);
      
      // Топ-3 категории
      month.categories
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([category, amount], index) => {
          const percent = Math.round((amount / month.totalExpense) * 100);
          const categoryElement = document.createElement('div');
          categoryElement.className = 'category-item';
          categoryElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: ${categoryColors[index % categoryColors.length]}; font-weight: bold;">■</span>
              <span>${category}</span>
            </div>
            <div style="text-align: right;">
              <div>${formatCurrency(amount)}</div>
              <small style="color: ${document.body.classList.contains('dark') ? '#aaa' : '#666'}">${percent}%</small>
            </div>
          `;
          monthElement.appendChild(categoryElement);
        });
      
      elements.topCategoriesList.appendChild(monthElement);
    });
    
    if (topMonths.length === 0) {
      elements.topCategoriesList.innerHTML = '<p style="text-align: center; opacity: 0.7;">Нет данных о расходах</p>';
    }
  }

  // Настройки графиков
  function getChartOptions(title) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.parsed.y.toLocaleString('ru-RU')} ₽`;
            }
          }
        },
        title: {
          display: false,
          text: title
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return (value / 1000).toFixed(0) + 'k ₽';
            },
            color: document.body.classList.contains('dark') ? '#eee' : '#333'
          },
          grid: {
            color: document.body.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: document.body.classList.contains('dark') ? '#eee' : '#333'
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    };
  }

  // Обновление интерфейса
  function updateUI() {
    const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };
    const capital = monthData.capital || 0;
    
    if (elements.incomeDisplay) {
      elements.incomeDisplay.textContent = formatCurrency(monthData.income);
    }
    
    if (elements.expenseDisplay) {
      elements.expenseDisplay.textContent = formatCurrency(monthData.expense);
    }
    
    // Расчет процента остатка
    const remaining = monthData.income - monthData.expense;
    const percentage = monthData.income > 0 
        ? Math.round((remaining / monthData.income) * 100)
        : 0;
    
    if (elements.percentDisplay) {
      elements.percentDisplay.textContent = (remaining < 0 ? '-' : '') + Math.abs(percentage) + '%';
      
      if (remaining < 0) {
        elements.percentDisplay.classList.add('negative');
      } else {
        elements.percentDisplay.classList.remove('negative');
        elements.percentDisplay.style.color = percentage < 20 ? '#f39c12' : '#2ecc71';
      }
    }
    
    if (elements.capitalDisplay) {
      elements.capitalDisplay.textContent = formatCurrency(capital);
    }
    
    updateBudgetWidget();
    updateReportsMenu();
    renderWidgets();
    renderAllCharts();
    renderSavingsWidget();
  }

  // Обновление виджета бюджета
  function updateBudgetWidget() {
    if (!elements.dailyBudgetAmount || !elements.budgetProgress) return;
    
    if (!budgetData.startDate) {
        elements.dailyBudgetAmount.textContent = formatCurrency(0);
        elements.budgetProgress.textContent = 'Не задано';
        return;
    }

    const today = new Date();
    const startDate = new Date(budgetData.startDate);
    const todayStr = today.toISOString().split('T')[0];

    // Проверяем, что бюджет установлен в текущем месяце
    if (today.getMonth() !== startDate.getMonth() || 
        today.getFullYear() !== startDate.getFullYear()) {
        elements.dailyBudgetAmount.textContent = formatCurrency(0);
        elements.budgetProgress.textContent = 'Срок истек';
        return;
    }

    // Рассчитываем прошедшие дни (включая текущий)
    const elapsedDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const remainingDays = Math.max(0, budgetData.days - elapsedDays + 1);

    if (remainingDays <= 0) {
        elements.dailyBudgetAmount.textContent = formatCurrency(0);
        elements.budgetProgress.textContent = 'Срок истек';
        return;
    }

    // Получаем данные о расходах за текущий месяц
    const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };
    const totalSpent = monthData.expense || 0;

    // Рассчитываем дневной бюджет
    let dailyBudget = 0;
    let remainingAmount = budgetData.totalAmount - totalSpent;

    if (remainingAmount <= 0) {
        dailyBudget = 0;
    } else {
        // Если сегодняшний день уже есть в истории, используем его данные
        if (budgetData.dailyHistory[todayStr]) {
            const todayBudget = budgetData.dailyHistory[todayStr];
            const availableToday = Math.max(0, todayBudget.dailyBudget - todayBudget.spentToday);
            
            if (availableToday > 0) {
                dailyBudget = availableToday;
            } else {
                // Если сегодняшний лимит исчерпан, распределяем остаток на оставшиеся дни
                const remainingAfterToday = remainingAmount - todayBudget.dailyBudget;
                dailyBudget = remainingAfterToday > 0 ? remainingAfterToday / (remainingDays - 1) : 0;
            }
        } else {
            // Первый день использования бюджета
            dailyBudget = remainingAmount / remainingDays;
            
            // Сохраняем данные на сегодня
            budgetData.dailyHistory[todayStr] = {
                date: todayStr,
                dailyBudget: dailyBudget,
                spentToday: 0
            };
            localStorage.setItem('budgetData', JSON.stringify(budgetData));
        }
    }

    // Форматируем вывод
    elements.dailyBudgetAmount.textContent = formatCurrency(dailyBudget);
    elements.budgetProgress.textContent = `${remainingDays} дн. осталось (${elapsedDays}/${budgetData.days})`;

    // Обновляем историю ежедневных трат
    if (budgetData.dailyHistory[todayStr]) {
        budgetData.dailyHistory[todayStr].spentToday = 
            Object.values(monthData.categories).reduce((sum, val) => sum + val, 0);
        localStorage.setItem('budgetData', JSON.stringify(budgetData));
    }
  }

  // Отрисовка всех графиков
  function renderAllCharts() {
    renderChart();
    renderCapitalChart();
    renderMiniCharts();
    if (elements.yearSummary && elements.yearSummary.classList.contains('show')) {
      renderYearCharts();
    }
  }

  // Отрисовка виджетов категорий
  function renderWidgets() {
    if (!elements.widgetsContainer) return;
    
    elements.widgetsContainer.innerHTML = '';
    const categories = financeData[currentMonth].categories || {};
    
    Object.entries(categories).forEach(([cat, val], index) => {
      const widget = document.createElement('div');
      widget.className = 'neumorphic-card widget';
      const color = categoryColors[index % categoryColors.length];
      
      widget.style.setProperty('--widget-color', color);
      
      widget.innerHTML = `
        <button class="delete-widget-btn" data-category="${cat}">×</button>
        <h3 style="color: ${color}">${cat}</h3>
        <p>${formatCurrency(val)}</p>
        <div class="widget-input-group">
          <input type="number" class="neumorphic-input widget-input" placeholder="Сумма" id="expense-${cat}">
          <button class="neumorphic-btn small" data-category="${cat}">+</button>
        </div>
      `;
      
      elements.widgetsContainer.appendChild(widget);
    });

    // Добавляем обработчики для новых кнопок
    document.querySelectorAll('.delete-widget-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const category = this.getAttribute('data-category');
        deleteWidget(category);
      });
    });

    document.querySelectorAll('.widget-input-group .neumorphic-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const category = this.getAttribute('data-category');
        addExpenseToCategory(category);
      });
    });
  }

  // Отрисовка виджета накоплений
  function renderSavingsWidget() {
    if (!savingsData.enabled || !elements.widgetsContainer) return;
    
    const widget = document.createElement('div');
    widget.className = 'neumorphic-card widget savings-widget';
    widget.style.setProperty('--widget-color', '#2ecc71');
    
    const progress = savingsData.goal > 0 ? Math.min(100, Math.round((savingsData.current / savingsData.goal) * 100)) : 0;
    
    widget.innerHTML = `
      <button class="delete-widget-btn" id="disable-savings-btn">×</button>
      <h3 style="color: #2ecc71">${savingsData.name || 'Накопления'}</h3>
      <div class="savings-progress-container">
        <div class="savings-progress-bar" style="width: ${progress}%"></div>
      </div>
      <p>${formatCurrency(savingsData.current)} / ${formatCurrency(savingsData.goal)} (${progress}%)</p>
      <div class="widget-input-group">
        <input type="number" class="neumorphic-input widget-input" placeholder="Сумма" id="savings-amount">
        <button class="neumorphic-btn small" id="add-to-savings-btn">+</button>
      </div>
    `;
    
    elements.widgetsContainer.prepend(widget);

    // Добавляем обработчики для кнопок виджета накоплений
    document.getElementById('disable-savings-btn')?.addEventListener('click', disableSavings);
    document.getElementById('add-to-savings-btn')?.addEventListener('click', addToSavings);
  }

  // Удаление виджета категории
  function deleteWidget(category) {
    if (confirm(`Удалить категорию "${category}" только для текущего месяца?`)) {
      const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };
      const categoryExpense = monthData.categories[category] || 0;
      
      monthData.expense -= categoryExpense;
      delete monthData.categories[category];
      
      financeData[currentMonth] = monthData;
      saveData();
      updateUI();
    }
  }

  // Добавление расхода к категории
  function addExpenseToCategory(category) {
    const input = document.getElementById(`expense-${category}`);
    if (!input) return;
    
    const expenseVal = parseFloat(input.value.replace(/\s+/g, '').replace(',', '.'));
    const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };

    if (!isNaN(expenseVal)) {
      monthData.expense += expenseVal;
      monthData.categories[category] = (monthData.categories[category] || 0) + expenseVal;
      input.value = '';
      
      financeData[currentMonth] = monthData;
      saveData();
      updateUI();
      
      const btn = input.nextElementSibling;
      if (btn) {
        btn.classList.add('pulse');
        setTimeout(() => btn.classList.remove('pulse'), 500);
      }
    }
  }

  // Отключение накоплений
  function disableSavings() {
    if (confirm('Отключить виджет накоплений?')) {
      savingsData.enabled = false;
      localStorage.setItem('savingsData', JSON.stringify(savingsData));
      updateUI();
    }
  }

  // Добавление к накоплениям
  function addToSavings() {
    const input = document.getElementById('savings-amount');
    if (!input) return;
    
    const amount = parseFloat(input.value.replace(/\s+/g, '').replace(',', '.'));
    
    if (!isNaN(amount) && amount > 0) {
      savingsData.current += amount;
      localStorage.setItem('savingsData', JSON.stringify(savingsData));
      input.value = '';
      updateUI();
      
      const btn = input.nextElementSibling;
      if (btn) {
        btn.classList.add('pulse');
        setTimeout(() => btn.classList.remove('pulse'), 500);
      }
    }
  }

  // Отрисовка основного графика расходов
  function renderChart() {
    const ctx = document.getElementById('barChart')?.getContext('2d');
    if (!ctx) return;
    if (chart) chart.destroy();

    const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };
    const categoryNames = Object.keys(monthData.categories);
    const values = Object.values(monthData.categories);

    const backgroundColors = categoryNames.map((_, index) => {
      const color = categoryColors[index % categoryColors.length];
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, shadeColor(color, -40));
      return gradient;
    });

    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categoryNames,
        datasets: [{
          label: 'Расходы по категориям',
          data: values,
          backgroundColor: backgroundColors,
          borderColor: document.body.classList.contains('dark') ? '#2e2e2e' : '#e0e5ec',
          borderWidth: 2,
          borderRadius: 10,
          borderSkipped: false,
        }]
      },
      options: getChartOptions('Расходы по категориям')
    });
  }

  // Отрисовка графика капитализации
  function renderCapitalChart() {
    const ctx = document.getElementById('capitalChart')?.getContext('2d');
    if (!ctx) return;
    if (capitalChart) capitalChart.destroy();

    const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };
    const capitalValue = monthData.capital || 0;

    capitalChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Капитализация'],
        datasets: [{
          label: 'Капитализация',
          data: [capitalValue],
          backgroundColor: '#3498db33',
          borderColor: '#3498db',
          borderWidth: 3,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#3498db',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: getChartOptions('Капитализация')
    });
  }

  // Отрисовка годовых графиков
  function renderYearCharts() {
    const labels = monthNames;
    const incomeData = [];
    const expenseData = [];
    const capitalData = [];
    
    for (let i = 0; i < 12; i++) {
      const monthData = financeData[i] || { income: 0, expense: 0, capital: 0 };
      incomeData.push(monthData.income);
      expenseData.push(monthData.expense);
      capitalData.push(monthData.capital);
    }
    
    // График доходов
    const incomeCtx = document.getElementById('yearIncomeChart')?.getContext('2d');
    if (incomeCtx) {
      if (yearIncomeChart) yearIncomeChart.destroy();
      
      yearIncomeChart = new Chart(incomeCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Доход',
            data: incomeData,
            backgroundColor: 'rgba(46, 204, 113, 0.7)',
            borderColor: 'rgba(46, 204, 113, 1)',
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          }]
        },
        options: getYearChartOptions('Доход по месяцам')
      });
    }
    
    // График расходов
    const expenseCtx = document.getElementById('yearExpenseChart')?.getContext('2d');
    if (expenseCtx) {
      if (yearExpenseChart) yearExpenseChart.destroy();
      
      yearExpenseChart = new Chart(expenseCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Расход',
            data: expenseData,
            backgroundColor: 'rgba(231, 76, 60, 0.7)',
            borderColor: 'rgba(231, 76, 60, 1)',
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          }]
        },
        options: getYearChartOptions('Расход по месяцам')
      });
    }
    
    // График капитализации
    const capitalCtx = document.getElementById('yearCapitalChart')?.getContext('2d');
    if (capitalCtx) {
      if (yearCapitalChart) yearCapitalChart.destroy();
      
      yearCapitalChart = new Chart(capitalCtx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Капитализация',
            data: capitalData,
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
            borderColor: 'rgba(52, 152, 219, 1)',
            borderWidth: 3,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: 'rgba(52, 152, 219, 1)',
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: getYearChartOptions('Капитализация по месяцам')
      });
    }
  }
  
  // Настройки годовых графиков
  function getYearChartOptions(title) {
    const options = getChartOptions(title);
    options.plugins.title.display = true;
    options.plugins.title.font.size = 16;
    return options;
  }

  // Затемнение цвета
  function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3), 16);
    let G = parseInt(color.substring(3,5), 16);
    let B = parseInt(color.substring(5,7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
  }

  // Показать сообщение об успехе
  function showSuccessMessage(message) {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.textContent = message;
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
      document.body.removeChild(successMsg);
    }, 3000);
  }

  // Настройка обработчиков событий
  function setupEventHandlers() {
    // Добавление дохода
    elements.addIncomeBtn?.addEventListener('click', () => {
      const incomeVal = parseFloat(elements.incomeInput.value.replace(/\s+/g, '').replace(',', '.'));
      const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };

      if (!isNaN(incomeVal)) {
        monthData.income += incomeVal;
        elements.incomeInput.value = '';
        financeData[currentMonth] = monthData;
        saveData();
        updateUI();
        
        elements.addIncomeBtn.classList.add('pulse');
        setTimeout(() => elements.addIncomeBtn.classList.remove('pulse'), 500);
      }
    });

    // Добавление категории (во все месяцы)
    elements.addCategoryBtn?.addEventListener('click', () => {
      const categoryName = elements.newCategoryInput.value.trim();
      if (categoryName) {
        // Добавляем категорию во все месяцы
        for (let i = 0; i < 12; i++) {
          const monthData = financeData[i] || { income: 0, expense: 0, categories: {} };
          if (!monthData.categories[categoryName]) {
            monthData.categories[categoryName] = 0;
            financeData[i] = monthData;
          }
        }
        elements.newCategoryInput.value = '';
        saveData();
        updateUI();
      }
    });

    // Меню категорий
    elements.categoryBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.categoryMenu.classList.toggle('show');
    });

    // Капитализация
    elements.capitalizationBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllMenus();
      elements.capitalizationMenu.classList.add('show');
      elements.capitalInput.value = financeData[currentMonth].capital || '';
      elements.capitalInput.focus();
    });

    elements.saveCapitalBtn?.addEventListener('click', () => {
      const capitalVal = parseFloat(elements.capitalInput.value.replace(/\s+/g, '').replace(',', '.'));
      if (!isNaN(capitalVal)) {
        financeData[currentMonth].capital = capitalVal;
        saveData();
        updateUI();
        closeAllMenus();
      }
    });

    elements.cancelCapitalBtn?.addEventListener('click', closeAllMenus);

    // Настройки/отчеты
    elements.settingsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllMenus();
      elements.settingsMenu.classList.add('show');
    });

    elements.closeReportsBtn?.addEventListener('click', closeAllMenus);

    // Бюджет
    elements.budgetSettingsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllMenus();
      elements.budgetSettingsMenu.classList.add('show');
    });

    elements.setBudgetBtn?.addEventListener('click', () => {
      closeAllMenus();
      elements.setBudgetModal.classList.add('show');
      elements.budgetAmount.value = '';
      elements.budgetDays.value = '';
    });

    elements.saveBudgetBtn?.addEventListener('click', () => {
      const amount = parseFloat(elements.budgetAmount.value.replace(/\s+/g, '').replace(',', '.'));
      const days = parseInt(elements.budgetDays.value);
      
      if (!isNaN(amount) && !isNaN(days) && days > 0) {
        const today = new Date();
        budgetData = {
          totalAmount: amount, days: days,
startDate: today.toISOString(),
spent: 0,
dailyHistory: {
[today.toISOString().split('T')[0]]: {
date: today.toISOString().split('T')[0],
dailyBudget: amount / days,
spentToday: 0
}
}
};
localStorage.setItem('budgetData', JSON.stringify(budgetData));
closeAllMenus();
updateBudgetWidget();

       showSuccessMessage('Бюджет установлен!');
  }
});

elements.cancelBudgetBtn?.addEventListener('click', closeAllMenus);

// Дополнительное меню
elements.moreBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllMenus();
  elements.moreMenu.classList.add('show');
});

// Виджет накоплений
elements.enableSavingsBtn?.addEventListener('click', () => {
  closeAllMenus();
  elements.savingsModal.classList.add('show');
  elements.savingsName.value = savingsData.name || '';
  elements.savingsGoal.value = savingsData.goal || '';
});

elements.saveSavingsBtn?.addEventListener('click', () => {
  const name = elements.savingsName.value.trim();
  const goal = parseFloat(elements.savingsGoal.value.replace(/\s+/g, '').replace(',', '.'));
  
  if (name && !isNaN(goal) && goal > 0) {
    savingsData = {
      enabled: true,
      name: name,
      goal: goal,
      current: savingsData.current || 0
    };
    localStorage.setItem('savingsData', JSON.stringify(savingsData));
    closeAllMenus();
    updateUI();
    
    showSuccessMessage('Цель накоплений установлена!');
  }
});

elements.cancelSavingsBtn?.addEventListener('click', closeAllMenus);

// Переключение месяцев
elements.monthTabs?.forEach(tab => {
  tab.addEventListener('click', () => {
    elements.monthTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentMonth = parseInt(tab.dataset.month);
    updateUI();
  });
});

// Обработчики ввода по нажатию Enter
elements.incomeInput?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') elements.addIncomeBtn.click();
});

elements.newCategoryInput?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') elements.addCategoryBtn.click();
});

elements.capitalInput?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') elements.saveCapitalBtn.click();
});

elements.budgetAmount?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') elements.saveBudgetBtn.click();
});

elements.budgetDays?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') elements.saveBudgetBtn.click();
});

elements.savingsName?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') elements.saveSavingsBtn.click();
});

elements.savingsGoal?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') elements.saveSavingsBtn.click();
});

// Закрытие меню при клике вне их
document.addEventListener('click', (e) => {
  if (!elements.categoryMenu?.contains(e.target) && e.target !== elements.categoryBtn) {
    elements.categoryMenu?.classList.remove('show');
  }
  if (!elements.capitalizationMenu?.contains(e.target) && e.target !== elements.capitalizationBtn) {
    elements.capitalizationMenu?.classList.remove('show');
  }
  if (!elements.settingsMenu?.contains(e.target) && e.target !== elements.settingsBtn) {
    elements.settingsMenu?.classList.remove('show');
  }
  if (!elements.yearSummary?.contains(e.target) && e.target !== elements.settingsBtn) {
    elements.yearSummary?.classList.remove('show');
  }
  if (!elements.budgetSettingsMenu?.contains(e.target) && e.target !== elements.budgetSettingsBtn) {
    elements.budgetSettingsMenu?.classList.remove('show');
  }
  if (!elements.setBudgetModal?.contains(e.target) && e.target !== elements.setBudgetBtn) {
    elements.setBudgetModal?.classList.remove('show');
  }
  if (!elements.moreMenu?.contains(e.target) && e.target !== elements.moreBtn) {
    elements.moreMenu?.classList.remove('show');
  }
  if (!elements.savingsModal?.contains(e.target) && e.target !== elements.enableSavingsBtn) {
    elements.savingsModal?.classList.remove('show');
  }
});

// Запрет масштабирования
document.addEventListener('gesturestart', function(e) {
  e.preventDefault();
});


}

// Инициализация приложения
function initializeApp() {
// Установка активного месяца
elements.monthTabs?.[currentMonth]?.classList.add('active');

// Проверка бюджета
if (budgetData.startDate) {
  const today = new Date();
  const lastBudgetDate = new Date(budgetData.startDate);
  
  if (today.getMonth() !== lastBudgetDate.getMonth() || 
      today.getFullYear() !== lastBudgetDate.getFullYear()) {
    updateBudgetWidget();
  }
}

// Настройка темы
if (localStorage.getItem('darkTheme') === 'true') {
  document.body.classList.add('dark');
  const icon = elements.themeToggleBtn?.querySelector('.theme-icon');
  if (icon) icon.textContent = '☀️';
}

// Обработчик переключения темы
elements.themeToggleBtn?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkTheme', document.body.classList.contains('dark'));
  
  const icon = elements.themeToggleBtn?.querySelector('.theme-icon');
  if (icon) {
    icon.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  }
  
  renderAllCharts();
});

// Настройка обработчиков событий
setupEventHandlers();

// Первоначальное обновление UI
updateUI();

}

// Запуск приложения
initializeApp();
});


         
