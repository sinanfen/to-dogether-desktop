function addTodo() {
    const input = document.getElementById('todoInput');
    const todoText = input.value.trim();
    if (todoText === '') return;
  
    const li = document.createElement('li');
    li.textContent = todoText;
  
    document.getElementById('todoList').appendChild(li);
    input.value = '';
  }
  