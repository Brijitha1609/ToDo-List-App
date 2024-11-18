import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export default function App() {
  const [task, setTask] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async (): Promise<void> => {
    try {
      const savedTasks = await AsyncStorage.getItem('tasks');
      if (savedTasks) setTasks(JSON.parse(savedTasks));
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const saveTasks = async (newTasks: Task[]): Promise<void> => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  };

  const addTask = (): void => {
    if (task.trim()) {
      const newTask = { id: Date.now().toString(), text: task, completed: false };
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      setTask('');
    }
  };

  const deleteTask = (taskId: string): void => {
    const updatedTasks = tasks.filter((item) => item.id !== taskId);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const toggleTaskCompletion = (taskId: string): void => {
    const updatedTasks = tasks.map((item) =>
      item.id === taskId ? { ...item, completed: !item.completed } : item
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const editTask = (taskId: string, newText: string): void => {
    const updatedTasks = tasks.map((item) =>
      item.id === taskId ? { ...item, text: newText } : item
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  // Pass the task-related state and functions to renderTask
  const renderTask = ({ item }: { item: Task }) => {
    return (
      <TaskItem
        task={item}
        onToggleCompletion={toggleTaskCompletion}
        onDelete={deleteTask}
        onEdit={editTask}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>To-Do List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task"
          value={task}
          onChangeText={setTask}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

interface TaskItemProps {
  task: Task;
  onToggleCompletion: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string, newText: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggleCompletion, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(task.text);
  
  // Initialize animation
  const scaleAnimation = useRef(new Animated.Value(0)).current;

  // Start animation when task is rendered
  useEffect(() => {
    Animated.timing(scaleAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const animationStyle = {
    transform: [
      { scale: scaleAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
    ],
  };

  return (
    <Animated.View style={[styles.taskContainer, animationStyle]}>
      <View style={styles.taskContainer}>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={editedText}
            onChangeText={setEditedText}
            onBlur={() => {
              setIsEditing(false);
              if (editedText.trim()) onEdit(task.id, editedText);
            }}
          />
        ) : (
          <TouchableOpacity onPress={() => onToggleCompletion(task.id)} onLongPress={() => setIsEditing(true)}>
            <Text style={[styles.taskText, task.completed && styles.completedTaskText]}>{task.text}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => onDelete(task.id)}>
          <Text style={styles.deleteButton}>X</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#5C5CFF',
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginLeft: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    width: '100%', 
  },

  taskText: {
    fontSize: 16,
    color: '#333',
    flex: 1, 
  },

  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  deleteButton: {
    color: '#FF5C5C',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },
});
