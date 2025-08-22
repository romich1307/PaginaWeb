class AllowIframeForMedia:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        # Solo para archivos de media (comprobantes, imágenes, etc.)
        if request.path.startswith('/media/'):
            if 'X-Frame-Options' in response.headers:
                del response.headers['X-Frame-Options']
        return response
