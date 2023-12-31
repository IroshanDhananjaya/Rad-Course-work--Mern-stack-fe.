import React, {useEffect, useState} from 'react';
import DropIn from "braintree-web-drop-in-react";
import Layout from "../components/Layout/Layout";
import {useAuth} from "../context/auth";
import {useCart} from "../context/cart";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import {toast} from 'react-toastify';


const CartPage = () => {
    const [auth, setAuth] = useAuth()
    const [cart, setCart] = useCart()
    const [clientToken, setClientToken] = useState("");
    const [instance, setInstance] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Remove Cart items
    const removeCartItem = (pid) => {
        try {
            let myCart = [...cart]
            let index = myCart.findIndex(item => item._id === pid)
            myCart.splice(index, 1)
            setCart(myCart)
            //Reset local storage when remove item in cart
            localStorage.setItem('cart', JSON.stringify(myCart));

        } catch (error) {
            console.log(error);
        }
    };

    //Find Total Price
    const totalPrice = () => {
        try {
            let total = 0;

            cart.map(item => {
                total += item.price;
            })
            return total.toLocaleString('en-US', {
                style: 'currency',
                currency: "USD"
            })
        } catch (error) {
            console.log(error)
        }
    }
    //get payment gateway token
    const getToken = async () => {
        try {
            const { data } = await axios.get("/api/v1/product/braintree/token");
            setClientToken(data?.clientToken);
        } catch (error) {
            console.log(error);
        }
    };
    useEffect(() => {
        getToken();
    }, [auth?.token]);


    //handle payments
    const handlePayment = async () => {
        try {
            setLoading(true);
            const { nonce } = await instance.requestPaymentMethod();
            const { data } = await axios.post("/api/v1/product/braintree/payment", {
                nonce,
                cart,
            });
            setLoading(false);
            localStorage.removeItem("cart");
            setCart([]);
            navigate("/dashboard/user/orders");
            toast.success('Payment Completed Successfully.');
        } catch (error) {
            console.log(error);
            setLoading(false);
        }
    };

    return (<Layout>

        <div className="container">
            <div className="row">
             
            </div>

            <div className="row mt-2">

                <div
                    className="col-md-12 mt-1 border border-info rounded-5 p-3"
                    style={{overflowY: 'scroll', height: '63vh'}}>
                    {cart?.map(p => (
                        <div className='row mb-2 flex-row p-2 ms-4 me-4 border border-warning shadow rounded-5'>
                            <div key={p._id} className="col-md-3 border-end">
                                <img
                                    src={`/api/v1/product/product-photo/${p._id}`}
                                    className="card-img-top"
                                    alt={p.name}
                                    style={{height: '120px'}}
                                />
                            </div>
                            <div className='col-md-12 mt-1 ps-5'>
                                <h6 className=' fw-bold text-dark'>{p.name}</h6>
                                <small>{p.description.substring(0, 45)}</small>
                                <p className=' text-primary m-1'>Price : {p.price}$</p>
                                <button
                                    className='btn btn-sm btn-danger'
                                    onClick={() =>
                                        removeCartItem(p._id)
                                    }
                                >Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="col-md-12  text-center">
                    <h4>Cart Summary</h4>
                    <p>Total | Checkout | Payment</p>
                    <hr/>
                    <h5>Total :<span className='text-danger'> {totalPrice()}</span></h5>
                    {auth?.user?.address ? (
                            <>
                                <div className={'mb-3'}>
                                    <h4>Current Address</h4>
                                    <h5 className={'text-success'}>{auth?.user?.address}</h5>
                                    <button
                                        className='btn btn-warning btn-sm mt-3'
                                        onClick={() => navigate('/dashboard/user/profile')}
                                    >Update Address
                                    </button>
                                </div>
                            </>
                        ) :
                        (
                           <div className='mb-3'>
                               {auth?.token?(
                                   <button
                                       className={'btn btn-sm btn-warning'}
                                       onClick={() => navigate('/dashboard/user/profile')}
                                   >Update Address</button>
                               ) : (
                                   <button
                                       className='btn btn-sm btn-danger mt-3'
                                       onClick={() => navigate('/login',{state:"/cart"})}
                                   >Please Login to Check Out</button>
                               )}
                           </div>
                        )
                    }
                    <div className='mt-1'>
                        {!clientToken || !cart?.length?(""):
                        <>
                            <DropIn
                                options={{
                                    authorization: clientToken,
                                    paypal:{
                                        flow:"vault"
                                    },
                                }}
                                onInstance={(instance) =>  setInstance(instance)}
                            />
                            <button
                                className='btn btn-primary btn-sm'
                                onClick={handlePayment}
                                disabled={loading || !instance || !auth?.user?.address}
                            >
                                {loading ? "Processing ...." : "Make Payment"}
                            </button>
                        </>
                        }
                    </div>
                </div>
            </div>
        </div>
    </Layout>);
};

export default CartPage;
