import React from 'react'
import Register from './Register';
import toast from 'react-hot-toast';
// import DeleteIcon from './icons/DeleteIcon';
// import EditIcon from './icons/EditIcon';
// import TickIcon from './icons/TickIcon';
import useSWR from 'swr';
import { CircleUserRound } from 'lucide-react';
import { Input } from './ui/input';
import { Plus } from 'lucide-react';
import { Trash, Pencil, Check } from "lucide-react";
import EditTodo from './EditTodo';
import Profile from './Profile';
import { useNavigate } from 'react-router-dom';

const fetcher = (url, options = {}) => {
    return fetch(url, {
        method: options.method || "GET",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        mode: 'cors',
        body: options.body ? JSON.stringify(options.body) : undefined
    }).then((res) => res.json());
}

const Todos = () => {
    const navigate = useNavigate();
    const { data, error, mutate, isLoading } = useSWR(`${import.meta.env.VITE_API_URL}/api/todos/`, fetcher);
    // if (error) {
    //     return <h1 className='text-2xl py-2 text-center'>Something went wrong!</h1>
    // }
    // if (isLoading) {
    //     return <h1 className='text-2xl py-2 text-center'>Loading...</h1>
    // }
    // console.log(data);

    useEffect(() => {
        if (error?.error === "Not Authenticated!") {
            navigate("/register"); // Redirect to register page
        }
    }, [error, navigate]);

    if (isLoading) return <h1 className='text-2xl py-2 text-center'>Loading...</h1>;
    if (error) return <h1 className='text-2xl py-2 text-center'>Something went wrong!</h1>;

    function handleError(error) {
        toast.error(error);
        throw new Error(error);
    }

    async function handleAddTodo(e) {
        e.preventDefault();

        const formData = new FormData(e.target)
        const title = formData.get("title")

        if (!title.trim().length) {
            toast.error("Todo can't be empty!")
            return;
        }

        const newTodo = {
            title: `${title} adding...`,
            _id: Date.now().toString(),
            isCompleted: false
        }

        async function addTodo() {
            const response = await fetcher(`${import.meta.env.VITE_API_URL}/api/todos`, {
                method: "POST",
                body: { title },
            });

            if (response.error) {
                handleError(response.error)
            }
            return [...data, response];
        }
        await mutate(addTodo, {
            optimisticData: [...data, newTodo],
            revalidate: true,
            rollbackOnError: true
        })
        e.target.reset();
    }

    async function deleteTodo(id) {
        toast.success("Todo deleted!")
        await mutate(
            async () => {
                const response = await fetcher(`${import.meta.env.VITE_API_URL}/api/todos/${id}`, {
                    method: "DELETE",
                    credentials: "include",
                });

                if (response.error) {
                    handleError(response.error);
                }
                return data.filter((todo) => todo._id !== id)
            },
            {
                optimisticData: data.filter((todo) => todo._id !== id),
                rollbackOnError: true,
                revalidate: false,
            }
        );
    }

    async function handleComplete(id, isCompleted) {
        await mutate(async () => {
            const response = await fetcher(`${import.meta.env.VITE_API_URL}/api/todos/${id}`, {
                method: 'PUT',
                body: { isCompleted: !isCompleted }
            });
            if (response.error) {
                handleError(response.error)
            }
            return data.map((todo) => {
                if (todo._id === id) {
                    return { ...todo, isCompleted: !isCompleted }
                }
                return todo;
            })
        }, {
            optimisticData: data.map((todo) => {
                if (todo._id === id) {
                    return { ...todo, isCompleted: !isCompleted }
                }
                return todo;
            }),
            rollbackOnError: true,
            revalidate: false,
        })
    }

    return (
        <div className='mx-auto mt-20 max-w-lg px-4 w-full flex flex-col gap-6'>
            <div className='flex justify-end'>
                <Profile />
            </div>
            <h1 className='bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-bold text-4xl text-center mb-4 text-transparent bg-clip-text'>Todo App</h1>

            <form onSubmit={handleAddTodo} className='flex gap-4 items-center'>
                <Input
                    type='text'
                    placeholder="Enter todo"
                    name="title"
                    id='title'
                    required
                    className="shadow-md"
                />
                <button className='h-9 rounded-md border border-input bg-transparent px-4 text-base shadow-md flex items-center hover:bg-primary transition ease-linear group'>
                    <Plus size={20} className='transition ease-linear group-hover:stroke-white' />
                </button>
            </form>
            {
                data?.length ? (
                    <div className='shadow-md border-2 border-input bg-transparent flex flex-col rounded'>
                        {
                            data.map((todo, index) => (
                                <div
                                    key={index}
                                    className={`flex h-10 items-center w-full ${index === data.length - 1 ? "border-b-0" : "border-b-2"}
                                    ${todo.isCompleted ? "bg-gray-200" : ""}
                                    `}
                                >
                                    <span className={`flex-1 px-3 ${todo.isCompleted ? 'line-through text-gray-500' : ''}`}
                                    >
                                        {todo.title}
                                    </span>
                                    <div className='px-3 flex gap-2'>
                                        <Check
                                            onClick={() => handleComplete(todo._id, todo.isCompleted)}
                                            size={25} color="black"
                                            className={`transition ease-in-out hover:cursor-pointer ${todo.isCompleted ? "text-primary" : "text-slate-300"}`} />
                                        <Trash size={25} color="black"
                                            className='cursor-pointer'
                                            onClick={() => deleteTodo(todo._id)}
                                        />
                                        <EditTodo />
                                    </div>
                                </div>
                            ))
                        }

                    </div>
                )
                    : <span>"You don't have any todos"</span>
            }
        </div>
    )
}

export default Todos;