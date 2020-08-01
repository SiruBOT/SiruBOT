import asyncio
import aiohttp
import os
import aiofiles
import aiofiles.os as aios


async def get_img_info(index: int):
    async with aiohttp.ClientSession() as session:
        async with session.get(f'https://cdn.hiyobi.me/data/json/{index}_list.json') as r:
            response = await r.json()
            img_title_list = [img_title['name'] for img_title in response]
            return img_title_list

async def download(index: int, img_title: list):
    async with aiohttp.ClientSession() as session:
        async with session.get(f'https://cdn.hiyobi.me/data/{index}/{img_title}') as r:
            async with aiofiles.open(f'{index}/{img_title}', mode='wb') as f:
                await f.write(await r.read())

async def check_folder(index: int):
    if not os.path.exists(f'./{index}'):
        await aios.mkdir(f'./{index}')

async def main(index: int):
    await check_folder(index)
    img_title_list = await get_img_info(index)
    tasks = [download(index, img_title) for img_title in img_title_list]
    asyncio.wait(tasks)

loop = asyncio.get_event_loop()
loop.run_until_complete(main(1496588)) # 품번인가)

#===============================================================================================
