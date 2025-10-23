const taskInput = document.getElementById("task");
const taskBtn = document.getElementById("add-task");
const taskList = document.getElementById("task-list");

taskBtn.addEventListener("click", function () {
  let taskText = taskInput.value.trim();
  if (taskText === "") {
    return;
  }
  let ListItem = document.createElement("li");
  ListItem.innerText = taskText;
  taskList.appendChild(ListItem);
  taskInput.value = "";
});
