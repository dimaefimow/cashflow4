document.addEventListener('DOMContentLoaded', function() {
  // Exchange rate API
  let exchangeRate = 90;
  let useDollars = false;
  let currentMonth = new Date().getMonth(); // Current month (0-11)
  
  // Month names for display
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 
    'Май', 'Июнь', 'Июль', 'Август', 
    'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  async function fetchExchangeRate() {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      exchangeRate = data.rates.RUB || 90;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      exchangeRate = 90;
    }
    updateUI();
  }

  function formatCurrency(amount) {
    if (useDollars) {
      return (amount / exchangeRate).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else {
      return amount.toLocaleString('ru-RU') + ' ₽';
    }
  }

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark');
    renderAllCharts();
  });

  // Currency toggle
  const currencyToggle = document.getElementById('currency-toggle');
  currencyToggle.addEventListener('change', () => {
    useDollars = !useDollars;
    updateUI();
    renderAllCharts();
  });

  // DOM elements
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
    closeYearSummary: document.getElementById('close-year-summary')
  };

  // App data structure
  let financeData = JSON.parse(localStorage.getItem('financeData')) || {};
  
  // Initialize data for all months if not exists
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

  // Save data to localStorage
  function saveData() {
    localStorage.setItem('financeData', JSON.stringify(financeData));
    updateCategoriesList();
  }

  // Update categories list
  function updateCategoriesList() {
    elements.categoriesList.innerHTML = '';
    const categories = financeData[currentMonth].categories || {};
    
    Object.keys(categories).forEach((category, index) => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';
      categoryItem.innerHTML = `
        <span style="color: ${categoryColors[index % categoryColors.length]}">■</span> ${category}
        <span>${formatCurrency(categories[category])}</span>
        <button class="delete-category-btn" onclick="deleteCategory('${category}')">×</button>
      `;
      elements.categoriesList.appendChild(categoryItem);
    });
  }

  // Delete category
  window.deleteCategory = function(category) {
    if (confirm(`Удалить категорию "${category}"? Все связанные расходы будут потеряны.`)) {
      const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };
      const categoryExpense = monthData.categories[category] || 0;
      
      // Update total expense
      monthData.expense -= categoryExpense;
      
      // Remove category
      delete monthData.categories[category];
      
      financeData[currentMonth] = monthData;
      saveData();
      updateUI();
    }
  };

  // Update UI
  function updateUI() {
    const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };
    const capital = monthData.capital || 0;
    
    elements.incomeDisplay.textContent = formatCurrency(monthData.income);
    elements.expenseDisplay.textContent = formatCurrency(monthData.expense);
    
    // Calculate percentage of remaining income after expenses
    const remaining = monthData.income - monthData.expense;
    const percentage = monthData.income > 0 
      ? Math.round((remaining / monthData.income) * 100)
      : 0;
    
    // Update percent display with negative values if needed
    elements.percentDisplay.textContent = (remaining < 0 ? '-' : '') + Math.abs(percentage) + '%';
    
    // Set color based on remaining amount
    if (remaining < 0) {
      elements.percentDisplay.classList.add('negative');
    } else {
      elements.percentDisplay.classList.remove('negative');
      elements.percentDisplay.style.color = percentage < 20 ? '#f39c12' : '#2ecc71';
    }
    
    elements.capitalDisplay.textContent = formatCurrency(capital);

    renderWidgets();
    renderAllCharts();
  }

  // Render all charts
  function renderAllCharts() {
    renderChart();
    renderCapitalChart();
    if (elements.yearSummary.classList.contains('show')) {
      renderYearCharts();
    }
  }

  // Category colors
  const categoryColors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
    '#9b59b6', '#1abc9c', '#d35400', '#34495e',
    '#16a085', '#27ae60', '#2980b9', '#8e44ad',
    '#f1c40f', '#e67e22', '#c0392b'
  ];

  // Render category widgets with colored shadows
  function renderWidgets() {
    elements.widgetsContainer.innerHTML = '';
    const categories = financeData[currentMonth].categories || {};
    
    Object.entries(categories).forEach(([cat, val], index) => {
      const widget = document.createElement('div');
      widget.className = 'neumorphic-card widget';
      const color = categoryColors[index % categoryColors.length];
      
      // Set CSS variable for the category color
      widget.style.setProperty('--widget-color', color);
      
      widget.innerHTML = `
        <button class="delete-widget-btn" onclick="deleteWidget('${cat}')">×</button>
        <h3 style="color: ${color}">${cat}</h3>
        <p>${formatCurrency(val)}</p>
        <div class="widget-input-group">
          <input type="number" class="neumorphic-input widget-input" placeholder="Сумма" id="expense-${cat}">
          <button class="neumorphic-btn small" onclick="addExpenseToCategory('${cat}')">+</button>
        </div>
      `;
      
      elements.widgetsContainer.appendChild(widget);
    });
  }

  // Global function to delete widget (category)
  window.deleteWidget = function(category) {
    if (confirm(`Удалить категорию "${category}" и все связанные расходы?`)) {
      const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };
      const categoryExpense = monthData.categories[category] || 0;
      
      // Update total expense
      monthData.expense -= categoryExpense;
      
      // Remove category
      delete monthData.categories[category];
      
      financeData[currentMonth] = monthData;
      saveData();
      updateUI();
    }
  };

  // Global function to add expense to category
  window.addExpenseToCategory = function(category) {
    const input = document.getElementById(`expense-${category}`);
    const expenseVal = parseFloat(input.value.replace(/\s+/g, '').replace(',', '.'));
    const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };

    if (!isNaN(expenseVal)) {
      monthData.expense += expenseVal;
      monthData.categories[category] = (monthData.categories[category] || 0) + expenseVal;
      input.value = '';
      
      financeData[currentMonth] = monthData;
      saveData();
      updateUI();
      
      // Add pulse animation to the button
      const btn = input.nextElementSibling;
      btn.classList.add('pulse');
      setTimeout(() => btn.classList.remove('pulse'), 500);
    }
  };

  // Event handlers
  elements.addIncomeBtn.addEventListener('click', () => {
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

  elements.addCategoryBtn.addEventListener('click', () => {
    const categoryName = elements.newCategoryInput.value.trim();
    const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };
    if (categoryName && !monthData.categories[categoryName]) {
      monthData.categories[categoryName] = 0;
      elements.newCategoryInput.value = '';
      financeData[currentMonth] = monthData;
      saveData();
      updateUI();
    }
  });

  elements.categoryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.categoryMenu.classList.toggle('show');
  });

  elements.capitalizationBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // Close other menus
    elements.categoryMenu.classList.remove('show');
    elements.settingsMenu.classList.remove('show');

    // Toggle capitalization menu
    const wasVisible = elements.capitalizationMenu.classList.contains('show');
    elements.capitalizationMenu.classList.toggle('show', !wasVisible);

    if (!wasVisible) {
      elements.capitalInput.value = financeData[currentMonth].capital || '';
      elements.capitalInput.focus();
    }
  });

  elements.saveCapitalBtn.addEventListener('click', () => {
    const capitalVal = parseFloat(elements.capitalInput.value.replace(/\s+/g, '').replace(',', '.'));
    if (!isNaN(capitalVal)) {
      financeData[currentMonth].capital = capitalVal;
      saveData();
      updateUI();
      elements.capitalizationMenu.classList.remove('show');
    }
  });

  elements.cancelCapitalBtn.addEventListener('click', () => {
    elements.capitalizationMenu.classList.remove('show');
  });

  elements.settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.settingsMenu.classList.toggle('show');
  });

  // Обработчик для кнопки "Годовой отчёт" в меню настроек
  elements.settingsMenu.addEventListener('click', (e) => {
    if (e.target.id === 'year-summary-btn') {
      elements.yearSummary.classList.add('show');
      renderYearCharts();
      elements.settingsMenu.classList.remove('show');
    }
  });

  elements.closeYearSummary.addEventListener('click', () => {
    elements.yearSummary.classList.remove('show');
  });

  // Month tab switching
  elements.monthTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      elements.monthTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMonth = parseInt(tab.dataset.month);
      updateUI();
    });
  });

  // Close menus when clicking outside
  document.addEventListener('click', (e) => {
    if (!elements.categoryMenu.contains(e.target) && e.target !== elements.categoryBtn) {
      elements.categoryMenu.classList.remove('show');
    }
    if (!elements.capitalizationMenu.contains(e.target) && e.target !== elements.capitalizationBtn) {
      elements.capitalizationMenu.classList.remove('show');
    }
    if (!elements.settingsMenu.contains(e.target) && e.target !== elements.settingsBtn) {
      elements.settingsMenu.classList.remove('show');
    }
    if (!elements.yearSummary.contains(e.target) && e.target !== elements.settingsBtn) {
      elements.yearSummary.classList.remove('show');
    }
  });

  // Helper function to shade colors
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

    return `rgb(${R},${G},${B})`;
  }

  // Charts
  let chart, capitalChart, yearIncomeChart, yearExpenseChart, yearCapitalChart;

  function renderChart() {
    const ctx = document.getElementById('barChart')?.getContext('2d');
    if (!ctx) return;
    if (chart) chart.destroy();

    const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };
    const categoryNames = Object.keys(monthData.categories);
    let values = Object.values(monthData.categories);

    if (useDollars) {
      values = values.map(val => val / exchangeRate);
    }

    // Create gradient for each bar
    const backgroundColors = categoryNames.map((_, index) => {
      const color = categoryColors[index % categoryColors.length];
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
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
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.parsed.y.toFixed(2)} ${useDollars ? '$' : '₽'}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toFixed(2) + (useDollars ? '$' : '₽');
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
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  function renderCapitalChart() {
    const ctx = document.getElementById('capitalChart')?.getContext('2d');
    if (!ctx) return;
    if (capitalChart) capitalChart.destroy();

    const monthData = financeData[currentMonth] || { income: 0, expense: 0, categories: {} };
    let capitalValue = monthData.capital || 0;
    
    if (useDollars) {
      capitalValue = capitalValue / exchangeRate;
    }

    capitalChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Капитализация'],
        datasets: [{
          label: 'Капитализация',
          data: [capitalValue],
          backgroundColor: '#3498db33',
          borderColor: '#3498db',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#3498db',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.parsed.y.toFixed(2)} ${useDollars ? '$' : '₽'}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toFixed(2) + (useDollars ? '$' : '₽');
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
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  function renderYearCharts() {
    // Prepare data for all months
    const labels = monthNames;
    const incomeData = [];
    const expenseData = [];
    const capitalData = [];
    
    for (let i = 0; i < 12; i++) {
      const monthData = financeData[i] || { income: 0, expense: 0, capital: 0 };
      if (useDollars) {
        incomeData.push(monthData.income / exchangeRate);
        expenseData.push(monthData.expense / exchangeRate);
        capitalData.push(monthData.capital / exchangeRate);
      } else {
        incomeData.push(monthData.income);
        expenseData.push(monthData.expense);
        capitalData.push(monthData.capital);
      }
    }
    
    // Render Income Chart
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
        options: createYearChartOptions('Доход по месяцам')
      });
    }
    
    // Render Expense Chart
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
        options: createYearChartOptions('Расход по месяцам')
      });
    }
    
    // Render Capital Chart
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
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: 'rgba(52, 152, 219, 1)',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: createYearChartOptions('Капитализация по месяцам')
      });
    }
  }
  
  function createYearChartOptions(title) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 14
          },
          color: document.body.classList.contains('dark') ? '#eee' : '#333'
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} ${useDollars ? '$' : '₽'}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value.toFixed(2) + (useDollars ? '$' : '₽');
            },
            color: document.body.classList.contains('dark') ? '#eee' : '#333'
          },
          grid: {
            color: document.body.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }
        },
        x: {
          ticks: {
            color: document.body.classList.contains('dark') ? '#eee' : '#333'
          },
          grid: {
            color: document.body.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      }
    };
  }

  // Initialize application
  function initializeApp() {
    // Set current month tab as active
    elements.monthTabs[currentMonth].classList.add('active');
    
    fetchExchangeRate();
    updateUI();
  }

  // Start the application
  initializeApp();
});
