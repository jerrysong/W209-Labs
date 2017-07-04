#!/bin/python
import datetime
import time

price_data = {}
with open('price.csv', 'r') as f:
    for line in f:
        timestamp, price = line.rstrip().split(';')
        strtime =  datetime.datetime.utcfromtimestamp(int(timestamp)).strftime("%Y-%m-%d")
        price_data[strtime] = price

composite_data = []
with open('search.csv', 'r') as f:
    for line in f:
        strtime, index = line.rstrip().split(',')
        if strtime in price_data:
            price = price_data[strtime]
            composite_data.append((strtime, price, index))

with open('composite.csv', 'w') as f:
    f.write('date,price,index\n')
    for strtime, price, index in composite_data:
        f.write('%s,%s,%s\n' % (strtime, price, index))
