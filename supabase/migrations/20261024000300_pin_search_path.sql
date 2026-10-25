-- Security advisor: pin search_path on the two pricing helpers.
alter function public.shipping_for(integer) set search_path = '';
alter function public.cod_fee() set search_path = '';
