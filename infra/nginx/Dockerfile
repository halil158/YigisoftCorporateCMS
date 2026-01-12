FROM nginx:1.28.1-alpine

# Remove default config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy our custom config into the image
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
