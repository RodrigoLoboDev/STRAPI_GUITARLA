// @ts-ignore

/**
 * order controller
 */

import { factories } from '@strapi/strapi'
// SDK de Mercado Pago
import {MercadoPagoConfig, Preference} from 'mercadopago';

// export default factories.createCoreController('api::order.order');

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
})

export default factories.createCoreController('api::order.order', ({strapi}) => ({
    async create(ctx) {
        // @ts-ignore
        try {
            const { products } = ctx.request.body;

            // Crear el objeto `items` requerido por la API de MercadoPago
            const items = products.products.map((product: any) => ({
                title: product.nombre,
                unit_price: product.precio,
                quantity: product.count,
                currency_id: "ARS", // Moneda (Argentina Pesos)
            }));

            // Crear la preferencia en MercadoPago
            const body = {
                items,
                back_urls: {
                    success: "http://localhost:5173/success",  // Cambia esto por tu URL
                    failure: "http://localhost:5173/failure",
                    pending: "http://localhost:5173/pending",
                },
                auto_return: "approved",  // Retorno automático
                // notification_url: "http://localhost:1337/api/webhooks"
            };

            // const response = await mercadopago.preferences.create(preference);
            const preference = new Preference(client)
            const result  = await preference.create({body})
            // console.log(result);
            

            // Guardar en Strapi el preferenceId y productos asociados a la orden
            const order = await strapi.service('api::order.order').create({
                data: {
                    preferenceId: result.id,
                    products: products.products,
                    total: products.total, // Sumar el total de la compra
                }
            });

            // Retornar la respuesta con el preferenceId para usarlo en el front
            ctx.send({ preferenceId: result.id, orderId: order.id });
            
        } catch (error) {
            console.error('Error al crear la preferencia de MercadoPago:', error);
            ctx.throw(500, 'Error al crear la preferencia de MercadoPago');
        }
    }
}))